function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import ContentService from '../content.service';
import MjmlService from '../mjml/mjml.service';
import ButtonCloseCommands from './buttonClose.command';
export default class ButtonApplyCommand {
  /**
   * The command name
   */

  /**
   * Command saves the email into Database
   *
   * @param editor
   * @param sender
   */
  static applyForm(editor, sender) {
    editor.runCommand('preset-mautic:dynamic-content-components-to-tokens');

    if (ContentService.isMjmlMode(editor)) {
      const htmlCode = MjmlService.getEditorHtmlContent(editor);
      const mjmlCode = MjmlService.getEditorMjmlContent(editor);

      if (!htmlCode || !mjmlCode) {
        throw new Error('Could not generate html from MJML');
      }

      ButtonCloseCommands.returnContentToTextarea(editor, htmlCode, mjmlCode);
    } else {
      const html = ContentService.getEditorHtmlContent(editor);
      ButtonCloseCommands.returnContentToTextarea(editor, html);
    }

    ButtonApplyCommand.postForm(editor, sender);
  }
  /**
   * Send POST request for sending the form, get and handle response
   * Use the global Mautic postForm function
   *
   * @param editor
   * @param sender
   */


  static postForm(editor, sender) {
    const emailForm = ButtonApplyCommand.getEmailForm();
    const emailFormSubject = ButtonApplyCommand.getEmailFormSubject(emailForm);
    const emailFormName = ButtonApplyCommand.getEmailFormName(emailForm);
    sender.set('className', 'fa fa-spinner fa-spin');

    if (emailFormSubject.val() === '') {
      emailFormSubject.val(ButtonApplyCommand.getDefaultEmailName());
    }

    if (emailFormName.val() === '') {
      emailFormName.val(ButtonApplyCommand.getDefaultEmailName());
    }

    Mautic.inBuilderSubmissionOn(emailForm);
    Mautic.postForm(emailForm, ButtonApplyCommand.postFormResponse.bind(this, editor, sender, emailForm));
    Mautic.inBuilderSubmissionOff();
  }
  /**
   * Get and handle response
   * Use the global Mautic functions
   *
   * @param editor
   * @param sender
   * @param emailForm
   * @param response
   */


  static postFormResponse(editor, sender, emailForm, response) {
    if (response.validationError !== null) {
      const title = Mautic.translate('grapesjsbuilder.panelsViewsCommandModalTitleError');
      ButtonApplyCommand.showModal(editor, title, response.validationError);
    } else {
      if (response.route) {
        // update URL in address bar
        MauticVars.manualStateChange = false;
        History.pushState(null, 'Mautic', response.route); // update Title

        Mautic.generatePageTitle(response.route);
      } // update form action


      if (ButtonApplyCommand.strcmp(emailForm[0].baseURI, emailForm[0].action) !== 0) {
        emailForm[0].action = emailForm[0].baseURI;
      }
    }

    sender.set('className', 'fa fa-check');
  }
  /**
   * Create modal to show information about saving email
   *
   * @param editor
   * @param title
   * @param text
   */


  static showModal(editor, title, text) {
    const modal = editor.Modal;
    modal.setTitle(`<h4 class="text-danger">${title}</h4>`);
    const body = document.createElement('div');
    const content = document.createElement('div');
    const footer = document.createElement('div');
    const btnClose = document.createElement('button');
    content.classList.add('panel-body');
    content.innerText = text;
    body.appendChild(content);
    btnClose.classList.add('btn', 'btn-lg', 'btn-default', 'text-primary');
    btnClose.innerText = 'Close';

    btnClose.onclick = () => {
      modal.close();
    };

    footer.classList.add('panel-footer', 'text-center');
    footer.appendChild(btnClose);
    body.appendChild(footer);
    modal.setContent(body);
    modal.open({
      attributes: {
        class: 'modal-content'
      }
    });
  }

  static getEmailForm() {
    return mQuery('form[name=emailform]');
  }

  static getEmailFormSubject(emailForm) {
    return emailForm.find('#emailform_subject');
  }

  static getEmailFormName(emailForm) {
    return emailForm.find('#emailform_name');
  }

  static getDefaultEmailName() {
    return `E-Mail ${moment().format('YYYY-MM-D hh:mm:ss')}`;
  }
  /**
   * Compares two strings and returns an integer value that represents the result of the comparison:
   *  1 - string 1 less than string 2
   *  0 - string 1 equal string 2
   * -1 - string 1 greater than string 2
   *
   * @param string1
   * @param string2
   *
   * @returns Integer
   */


  static strcmp(string1, string2) {
    if (string1.toString() < string2.toString()) return -1;
    if (string1.toString() > string2.toString()) return 1;
    return 0;
  }

}

_defineProperty(ButtonApplyCommand, "name", 'preset-mautic:apply-email');