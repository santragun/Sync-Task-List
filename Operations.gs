function PrepareTaskListMenu(selected) {
  try {
    let tasksListMenu = CardService.newSelectionInput()
      .setFieldName('taskList')
      .setType(CardService.SelectionInputType.DROPDOWN);

    let taskLists = Tasks.Tasklists.list();
    if (!taskLists.items) {
      tasksListMenu.addItem('No task lists found to share!', '', false);
    }
    else {
      for (let i = 0; i < taskLists.items.length; i++) {
        let taskList = taskLists.items[i];
        let selectedStatus = false;
        if (selected && taskList.id == selected) {
          selectedStatus = true;
        }
        tasksListMenu.addItem(taskList.title, taskList.id, selectedStatus);
        Logger.log('Task list with title "%s" and ID "%s" was found.', taskList.title, taskList.id);
      }
    }
    return tasksListMenu;
  }
  catch ({ message }) {
    Logger.log('PrepareTaskListMenu Exception: ' + message);
  }
}

function ShareTaskList(e) {
  try {
    let email = e.formInput.emailField;
    let taskList = e.formInput.taskList;
    console.log(taskList);

    if (!email || !email.trim() || !taskList) {
      let error = '';
      if (!email || !email.trim()) {
        error = 'Email address';
      }
      if (!taskList) {
        error = 'Tasklist';
      }
      return CardService.newNavigation().popToRoot().pushCard(ShareTaskListCard({
        error: error,
        widget: CardService.newTextParagraph().setText('<font color="#ff0000">' + error + ' not specified</font>'),
        emails: email,
        taskList: taskList
      }));
    }
    let emails = email.split(',').filter(function (e) { return e.trim() });
    let invalidEmails = callAPIExec('ValidateEmails', [emails]);

    if (typeof invalidEmails == 'string' && invalidEmails.includes('Not authorized')) {
      let authorizeCard = AuthorizeCard(invalidEmails);
      return authorizeCard.build();
    }
    else {
      if (typeof invalidEmails == 'object' && invalidEmails.length > 0) {
        let error = 'Invalid Email address: ';
        return CardService.newNavigation().popToRoot().pushCard(ShareTaskListCard({
          error: error,
          widget: CardService.newTextParagraph().setText('<font color="#ff0000">' + error + '</font>' + invalidEmails.join(', ')),
          emails: email,
          taskList: taskList
        }));
      }
    }


    let taskListTitle = Tasks.Tasklists.get(taskList).title;
    let tasksDetails = Tasks.Tasks.list(taskList, { showCompleted: true, showHidden: true });
    let taskDetails = [];
    if (userProperties.getProperty(taskList)) {
      taskList = userProperties.getProperty(taskList);
    }
    else {
      userProperties.setProperty(taskList, taskList);
    }
    let sharedLists = [];
    if (userProperties.getProperty('sharedLists')) {
      sharedLists = JSON.parse(userProperties.getProperty('sharedLists'));
    }
    sharedLists.push(taskList);
    userProperties.setProperty('sharedLists', JSON.stringify(sharedLists));

    for (let i = 0; i < tasksDetails.items.length; i++) {
      let task = tasksDetails.items[i];
      let taskid = task.id;
      if (userProperties.getProperty(taskid)) {
        taskid = userProperties.getProperty(taskid);
      }
      else {
        userProperties.setProperty(taskid, taskid);
      }
      taskDetails.push([taskid, task.title, task.status, task.due, Session.getActiveUser().getEmail(), task.notes]);
      console.log(taskDetails[i]);
    }

    let response = callAPIExec('AddTaskList', [taskList, taskListTitle, taskDetails, emails, Session.getActiveUser().getEmail()]);
    if (typeof response == 'string' && response.includes('Not authorized')) {
      let authorizeCard = AuthorizeCard(response);
      return authorizeCard.build();
    }
    else {
      SetupTrigger();
      let text = '';
      if (response[0].length > 0) {
        text += 'Task List Successfully Shared to ' + response[0].join(', ') + '.\n';
        SendNotification(response[0], taskListTitle, tasksDetails);
      }
      if (response[1].length > 0) {
        text += 'Task List previously shared to ' + response[1].join(', ');
      }

      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText(text))
        .setNavigation(CardService.newNavigation().popToRoot())
        .build();
    }
  }
  catch ({ message }) {
    Logger.log('ShareTaskList Exception: ' + message);
  }
}
