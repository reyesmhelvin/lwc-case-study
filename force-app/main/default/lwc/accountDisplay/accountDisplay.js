import { LightningElement, track, wire } from 'lwc';
import fetchDataHelper from './fetchDataHelper';
import getAccountList from '@salesforce/apex/AccountController.getAccountList';
import { CurrentPageReference } from 'lightning/navigation';
//import findContacts from '@salesforce/apex/ContactController.findContacts';
import { registerListener, unregisterAllListeners, fireEvent } from 'c/pubsub';

import { createRecord } from 'lightning/uiRecordApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import TYPE_FIELD from '@salesforce/schema/Account.Type';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from './utils';

const actions = [
    { label: 'Show details', name: 'show_details' },
    { label: 'Delete', name: 'delete' },
];

const columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Id', fieldName: 'Id'},
    { label: 'Type', fieldName: 'Type' },
    { label: 'Industry', fieldName: 'Industry' },
    {
        type: 'action',
        typeAttributes: { rowActions: actions },
    },
];

export default class AccountDisplay extends LightningElement {
    @track accounts = [];
    @track columns = columns;
    @track record = {};

    name = ''
    type = ''
    industry = ''
    @track accountId;

    @wire(CurrentPageReference) pageRef;

    @wire(getAccountList) 
    getAccounts({
        error,
        data
    }) {
        if (data) {
            this.accounts = [...data];
            console.log(data);
            console.log(JSON.stringify(data, null, '\t'));
        } else if (error) {
            this.error = error;
        }
    }
    
    connectedCallback() {
        //this.data = [...this.accounts.data];
        registerListener('dataSubmit', this.handleDataSubmit, this);
        //this.data = await fetchDataHelper({ amountOfRecords: 100 });

       
    }

    disconnectedCallback() {
        // unsubscribe from searchKeyChange event
        unregisterAllListeners(this);
    }

    handleDataSubmit(dataSubmit) {
        console.log('nadidinig', dataSubmit);
        let parsedDataSubmit = JSON.parse(dataSubmit);
        //dataSubmitWithId.Id = '123';
        let newDataSubmit = [...this.accounts];
        newDataSubmit.push(parsedDataSubmit);
        this.accounts = [...newDataSubmit];
        console.log('nadagdag ba?', JSON.stringify(this.accounts));
    }
    
    handleSaveAccounts() {
        console.log('mama nakausap din kita!');
        this.iterateOverTable();

        const fields = {};
        fields[NAME_FIELD.fieldApiName] = this.name;
        fields[TYPE_FIELD.fieldApiName] = this.type;
        fields[INDUSTRY_FIELD.fieldApiName] = this.industry;

        const recordInput = { apiName: ACCOUNT_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then(account => {
                this.accountId = account.id;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Account created',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: reduceErrors(error).join(', '),
                        variant: 'error'
                    })
                );
            });
    }

    iterateOverTable(event){        
        let table = this.template.querySelector('lightning-datatable');
        let rows = table.getSelectedRows();
        rows.forEach( element => console.log('data table elements',JSON.stringify(element)));

    }


    handleRowAction(event) {
        
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'delete':
                this.deleteRow(row);
                break;
            case 'show_details':
                this.showRowDetails(row);
                break;
            default:
        }
    }

    deleteRow(row) {
        const { id } = row;
        const index = this.findRowIndexById(id);
        if (index !== -1) {
            this.accounts = this.accounts
                .slice(0, index)
                .concat(this.accounts.slice(index + 1));
        }
    }

    findRowIndexById(id) {
        let ret = -1;
        this.accounts.some((row, index) => {
            if (row.id === id) {
                ret = index;
                return true;
            }
            return false;
        });
        return ret;
    }

    showRowDetails(row) {
        this.record = row;
    }
}
