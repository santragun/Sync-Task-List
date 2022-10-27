function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}

function Home() {
  // userProperties.deleteAllProperties();
  try {
    SetupTrigger();
    let pendingTaskList = callAPIExec('RetrieveUserTasks', [Session.getActiveUser().getEmail(), 'pending']);
    if (typeof pendingTaskList == 'string' && pendingTaskList.includes('Not authorized')) {
      let authorizeCard = AuthorizeCard(pendingTaskList);
      return authorizeCard.build();
    }
    if (pendingTaskList.length > 0) {
      return SharedToMeTaskListsCard({ "parameters": { "callee": "home" } });
    }
    else {
      return HomeCard().build();
    }
  }
  catch ({ message }) {
    Logger.log('Home Exception: ' + message);
  }
}

function HomeCard() {
  let shareTaskListAction = CardService.newAction()
    .setFunctionName('ShareTaskListCard')
    .setParameters({});

  let shareTaskListButton = CardService.newTextButton()
    .setText('Share')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(primaryColor)
    .setOnClickAction(shareTaskListAction);

  let shareTaskListSection = CardService.newDecoratedText()
    .setTopLabel('Share task list')
    .setText('Share your task list with others')
    .setButton(shareTaskListButton)
    .setWrapText(true);

  let sharedToMeTaskListsAction = CardService.newAction()
    .setFunctionName('SharedToMeTaskListsCard')
    .setParameters({ "callee": "homeCard" });

  let sharedToMeTaskListsButton = CardService.newTextButton()
    .setText('Open')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(primaryColor)
    .setOnClickAction(sharedToMeTaskListsAction);

  let sharedToMeTaskListsSection = CardService.newDecoratedText()
    .setTopLabel('Shared Task Lists from others')
    .setText('Task lists waiting your confirmation to be shared with you')
    .setButton(sharedToMeTaskListsButton)
    .setWrapText(true);

  let allSharedTaskListsAction = CardService.newAction()
    .setFunctionName('AllSharedTaskListsCard');

  let allSharedTaskListsButton = CardService.newTextButton()
    .setText('View')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(primaryColor)
    .setOnClickAction(allSharedTaskListsAction);

  let allSharedTaskListsSection = CardService.newDecoratedText()
    .setTopLabel('All Shared Tasks Lists')
    .setText('All Shared Task Lists')
    .setButton(allSharedTaskListsButton)
    .setWrapText(true);

  let syncAction = CardService.newAction()
    .setFunctionName('Sync')
    .setParameters({ "type": "start" });

  let syncButton = CardService.newTextButton()
    .setText('Sync')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(primaryColor)
    .setOnClickAction(syncAction);

  let syncSection = CardService.newDecoratedText()
    .setTopLabel('Sync All Task lists')
    .setText('Sync Shared Task Lists ')
    .setButton(syncButton)
    .setWrapText(true);

  let cardSection = CardService.newCardSection()
    .setHeader('Sync Task List')
    .addWidget(shareTaskListSection)
    .addWidget(sharedToMeTaskListsSection)
    .addWidget(allSharedTaskListsSection)
    .addWidget(syncSection);

  let card = CardService.newCardBuilder()
    .addSection(cardSection)

  return card;
}

function ShareTaskListCard(e) {
  try {
    let emailInput = CardService.newTextInput()
      .setFieldName('emailField')
      .setTitle('Email address')
      .setHint('Add comma separated email addresses')
      // .setValue('samryfentaye1319@gmail.com')
      .setMultiline(false);

    let saveTaskListAction = CardService.newAction()
      .setFunctionName('ShareTaskList');

    let saveTaskListsButton = CardService.newTextButton()
      .setText('Save')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor(primaryColor)
      .setOnClickAction(saveTaskListAction);

    let cardSection = CardService.newCardSection()
      .setHeader('Share new Task List')
      .addWidget(emailInput);

    let taskList = PrepareTaskListMenu(e.taskList);
    if (e) {
      if (e.error == 'Email address' || e.error == 'Invalid Email address: ') {
        cardSection.addWidget(e.widget);
      }
      cardSection.addWidget(taskList);

      if (e.error == 'Tasklist') {
        cardSection.addWidget(e.widget);
      }

      if (e.email) {
        emailInput.setValue(e.emails);
      }
    }
    else {
      cardSection.addWidget(taskList);
    }

    cardSection.addWidget(saveTaskListsButton);

    let card = CardService.newCardBuilder().addSection(cardSection);
    card.setName('ShareCard');
    return card.build();
  }
  catch ({ message }) {
    Logger.log('ShareTaskListCard Exception: ' + message);
  }
}

function SharedToMeTaskListsCard(callee) {
  try {
    let taskList = callAPIExec('RetrieveUserTasks', [Session.getActiveUser().getEmail(), 'pending']);
    Logger.log(taskList);
    if (typeof taskList == 'string' && taskList.includes('Not authorized')) {
      let authorizeCard = AuthorizeCard(taskList);
      return authorizeCard.build();
    }

    let card = CardService.newCardBuilder();
    if (taskList.length == 0) {
      card.addSection(CardService.newCardSection()
        .addWidget(
          CardService.newDecoratedText()
            .setTopLabel('Pending Task Lists')
            .setText('You don\'t have new shared task lists')));
    }
    else {
      for (let i = 0; i < taskList.length; i++) {
        for (let j = 0; j < taskList[i]['tasks'].length; j++) {
          if (taskList[i]['tasks'][j] == '') {
            taskList[i]['tasks'][j] = 'no title';
          }
        }
        let task = CardService.newDecoratedText()
          .setTopLabel(taskList[i].TaskList)
          .setText(taskList[i]['tasks'].join('\n'));

        let acceptAction = CardService.newAction()
          .setFunctionName('AcceptTaskList')
          .setParameters({
            'taskListId': taskList[i].taskListId,
            'userId': taskList[i].userId,
            'callee': callee.parameters.callee
          });
        let rejectAction = CardService.newAction()
          .setFunctionName('RejectTaskList')
          .setParameters({
            'taskListId': taskList[i].taskListId,
            'userId': taskList[i].userId,
            'callee': callee.parameters.callee
          });

        let acceptButton = CardService.newTextButton()
          .setText('Accept')
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setBackgroundColor('#348c31')
          .setOnClickAction(acceptAction);

        let rejectButton = CardService.newTextButton()
          .setText('Reject')
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setBackgroundColor('#bb0a1e')
          .setOnClickAction(rejectAction);

        let buttonList = CardService.newButtonSet()
          .addButton(acceptButton)
          .addButton(rejectButton);

        let cardSection = CardService.newCardSection()
          .setHeader('From: ' + taskList[i]['from'])
          .addWidget(task)
          .addWidget(buttonList);

        card.addSection(cardSection);
      }
    }

    if (callee.parameters.callee == 'home') {
      let footerAction = CardService.newAction()
        .setFunctionName('BackToHome');

      let footer = CardService
        .newFixedFooter()
        .setPrimaryButton(
          CardService
            .newTextButton()
            .setText("Main Menu")
            .setOnClickAction(footerAction));
      card.setFixedFooter(footer);
    }

    return card.build();
  }
  catch ({ message }) {
    Logger.log('SharedToMeTaskListsCard Exception: ' + message);
  }
}

function AllSharedTaskListsCard() {
  try {
    let taskList = callAPIExec('RetrieveUserTasks', [Session.getActiveUser().getEmail(), 'all']);
    if (typeof taskList == 'string' && taskList.includes('Not authorized')) {
      let authorizeCard = AuthorizeCard(taskList);
      return authorizeCard.build();
    }

    let card = CardService.newCardBuilder();
    if (taskList.length == 0) {
      card.addSection(CardService.newCardSection()
        .addWidget(
          CardService.newDecoratedText()
            .setTopLabel('Task Lists')
            .setText('You don\'t have shared task lists')));
    }
    else {
      for (let i = 0; i < taskList.length; i++) {
        for (let j = 0; j < taskList[i]['tasks'].length; j++) {
          if (taskList[i]['tasks'][j] == '') {
            taskList[i]['tasks'][j] = 'no title';
          }
        }
        let text = '<font color="#757575">' + '<b>From:</b> ' + taskList[i]['from'] + '\n';
        if (taskList[i]['from'] == 'Me') {
          text += '<b>To:</b>\n' + taskList[i]['to'].join('\n');
        }
        else {
          text += '<b>To:</b> ' + taskList[i]['to'].join('\n');
          text += '\n<b>Status:</b> ' + taskList[i]['status'];
        }
        text += '</font>\n\n<b>Tasks:</b>\n' + taskList[i]['tasks'].join('\n');
        let task = CardService.newDecoratedText()
          .setText(text).setWrapText(true);

        let cardSection = CardService.newCardSection()
          .setHeader(taskList[i].TaskList)
          .addWidget(task);

        card.addSection(cardSection);
      }
    }

    return card.build();
  }
  catch ({ message }) {
    Logger.log('AllSharedTaskListsCard Exception: ' + message);
  }
}

function AuthorizeCard(response) {
  try {
    let cardSection1AuthorizeButtonAction1 = CardService.newOpenLink()
      .setUrl(response.substring('Not authorized'.length))
      .setOnClose(CardService.OnClose.RELOAD_ADD_ON)
      .setOpenAs(CardService.OpenAs.OVERLAY);

    let cardSection1BAuthorizeButton = CardService.newTextButton()
      .setText('<font color="#228B22">' + whitespace + whitespace + whitespace + 'Authorize' + '</font>')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOpenLink(cardSection1AuthorizeButtonAction1);

    let authorizeLabel = CardService.newDecoratedText()
      .setText('<font color="#2a5278">Click on authorize to share the task list</font>')
      .setWrapText(true);

    let cardSection1 = CardService.newCardSection()
      .addWidget(authorizeLabel)
      .addWidget(cardSection1BAuthorizeButton);

    return CardService.newCardBuilder()
      .addSection(cardSection1);
  }
  catch ({ message }) {
    Logger.log('AuthorizeCard Exception: ' + message);
  }
}

function BackToHome() {
  return CardService.newNavigation().popCard().pushCard(HomeCard().build());
}

function TimeoutCard(parameters) {
  try {
    let executionTimeoutLabel = CardService.newDecoratedText()
      .setText('<font color="#2a5278">Syncing operation is taking a bit longer<br>Click continue button to continue the process</font>')
      .setWrapText(true);

    let continueAction = CardService.newAction()
      .setFunctionName('Sync')
      .setParameters({
        'type': 'continue',
        'i': JSON.stringify(parameters.i),
        'j': JSON.stringify(parameters.j),
        'tasksToSend': JSON.stringify(parameters.tasksToSend)
      });

    let stopAction = CardService.newAction()
      .setFunctionName('Sync')
      .setParameters({
        'type': "stop"
      });


    let footer = CardService
      .newFixedFooter()
      .setPrimaryButton(
        CardService
          .newTextButton()
          .setText("Continue")
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setBackgroundColor('#348c31')
          .setOnClickAction(continueAction))
      .setSecondaryButton(
        CardService
          .newTextButton()
          .setText("Stop")
          .setBackgroundColor('#bb0a1e')
          .setOnClickAction(stopAction));

    let card = CardService.newCardBuilder().addSection(
      CardService.newCardSection()
        .addWidget(executionTimeoutLabel))
      .setFixedFooter(footer);

    return CardService.newNavigation().popToRoot().pushCard(card.build());
  }
  catch ({ message }) {
    Logger.log('TimeoutCard Exception: ' + message);
  }
}
