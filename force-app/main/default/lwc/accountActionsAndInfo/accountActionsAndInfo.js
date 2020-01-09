import { LightningElement } from 'lwc';

export default class AccountActionsAndInfo extends LightningElement {

    handleSaveAccounts() {
        this.dispatchEvent(new CustomEvent('saveaccounts'));
    }

}