import { LightningElement, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners, fireEvent } from 'c/pubsub';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAccountList from '@salesforce/apex/AccountController.getAccountList';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import TYPE_FIELD from '@salesforce/schema/Account.Type';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';
import { reduceErrors, uuidv4 } from './utils';

const actions = [
    { label: 'Edit', name: 'edit' },
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
    @track accountId;

    recordTypeId = ''
    selectedAccountRecords = []; 
    
    @wire(CurrentPageReference) pageRef;

    @wire(getAccountList) 
    getAccounts({
        error,
        data
    }) {
        if (data) {
            this.accounts = [...data];
            //console.log(data);
            //console.log(JSON.stringify(data, null, '\t'));
        } else if (error) {
            this.error = error;
        }
    }
    
    connectedCallback() {
        registerListener('dataSubmit', this.handleDataSubmit, this);
        registerListener('dataEdit', this.handleDataEdit, this);
        //this.data = await fetchDataHelper({ amountOfRecords: 100 });
        console.log('recordTypeId',this.recordTypeId);
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    handleDataSubmit(dataSubmit) {
        console.log('insert mode');
        let parsedDataSubmit = JSON.parse(dataSubmit);
        let newDataSubmit = [...this.accounts];
        parsedDataSubmit.uid = uuidv4();
        newDataSubmit.unshift(parsedDataSubmit);
        this.accounts = [...newDataSubmit];
    }

    handleDataEdit(payload) {
        let index = 0;
        let modifiedAccounts = [...this.accounts];
        console.log('current accounts',JSON.stringify(modifiedAccounts));
        let modifiedAccount = modifiedAccounts.find((account, idx) => {
            index = idx;
            return account.Id == payload.Id;
        })
        console.log('found',modifiedAccount);
        let modifiedRecord = JSON.parse(JSON.stringify(modifiedAccount))
        modifiedRecord.Name = payload.Name;
        modifiedRecord.Type = payload.Type;
        modifiedRecord.Industry = payload.Industry;
        console.log('edited ver',modifiedRecord);
        let mor = modifiedAccounts.splice(index,1,modifiedRecord);
        console.log('mor',JSON.stringify(modifiedAccounts));
        this.accounts = [...modifiedAccounts];
    }
    
    handleSaveAccounts() {
        this.selectedAccountRecords = [];
        this.processSelectedAccountsForCreation();
        
    }

    addUrlToAccountRecord(uid) {
        return this.accounts.map((e) => {
            console.log('e',e.uid);
            if (e.uid === uid) {
                e.id = this.accountId;
                console.log(e.id);
            };
        });
    }

    createAccounts(record) {
        const fields = {};
        fields[NAME_FIELD.fieldApiName] = record.Name;
        fields[TYPE_FIELD.fieldApiName] = record.Type;
        fields[INDUSTRY_FIELD.fieldApiName] = record.Industry;

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

    processSelectedAccountsForCreation(event){       
        let table = this.template.querySelector('lightning-datatable');
        let rows = table.getSelectedRows();
        let stringifedRows = JSON.stringify(rows);
        this.selectedAccountRecords = [...JSON.parse(stringifedRows)];
        this.selectedAccountRecords.forEach(rec => this.createAccounts(rec));
    }


    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'delete':
                this.deleteRow(row);
                break;
            case 'edit':
                //this.editRow(row);
                this.editRow(event)
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

    editRow(event) {
        fireEvent(this.pageRef, 'editData', JSON.stringify(event.detail.row));
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
