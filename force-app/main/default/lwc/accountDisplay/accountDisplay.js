import { LightningElement, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners, fireEvent } from 'c/pubsub';
import { createRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAccountList from '@salesforce/apex/AccountController.getAccountList';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import TYPE_FIELD from '@salesforce/schema/Account.Type';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';
import ID_FIELD from '@salesforce/schema/Account.Id';
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
    isEditMode = false;
    
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
        let modifiedAccount = modifiedAccounts.find((account, idx) => {
            index = idx;
            return account.Id == payload.Id;
        })
        let modifiedRecord = JSON.parse(JSON.stringify(modifiedAccount))
        modifiedRecord.Name = payload.Name;
        modifiedRecord.Type = payload.Type;
        modifiedRecord.Industry = payload.Industry;
        modifiedAccounts.splice(index,1,modifiedRecord);
        this.accounts = [...modifiedAccounts];
        this.isEditMode = true;
    }
    
    handleSaveAccounts() {
        if (this.isEditMode) {
            console.log('UPDATE');
            this.selectedAccountRecords = [];
            this.processSelectedAccountsForUpdate();
        } else {
            console.log('CREATE');
            this.selectedAccountRecords = [];
            this.processSelectedAccountsForCreation();
        }
        
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
        console.log('createAccounts');
        const fields = {};
        fields[NAME_FIELD.fieldApiName] = record.Name;
        fields[TYPE_FIELD.fieldApiName] = record.Type;
        fields[INDUSTRY_FIELD.fieldApiName] = record.Industry;

        const recordInput = { fields, clientOptions: ACCOUNT_OBJECT.objectApiName };

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

    updateAccounts(record) {
        console.log('updateAccounts');
        const fields = {};
        fields[ID_FIELD.fieldApiName] = record.Id;
        fields[NAME_FIELD.fieldApiName] = record.Name;
        fields[TYPE_FIELD.fieldApiName] = record.Type;
        fields[INDUSTRY_FIELD.fieldApiName] = record.Industry;

        const recordInput = { fields };

        updateRecord(recordInput)
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

    //this could be refactored, halted coz error is being encountered
    processSelectedAccountsForCreation(event){       
        let table = this.template.querySelector('lightning-datatable');
        let rows = table.getSelectedRows();
        let stringifedRows = JSON.stringify(rows);
        this.selectedAccountRecords = [...JSON.parse(stringifedRows)];
        this.selectedAccountRecords.forEach(rec => this.createAccounts(rec));
    }

    //this could be refactored, halted coz error is being encountered
    processSelectedAccountsForUpdate(event){       
        let table = this.template.querySelector('lightning-datatable');
        let rows = table.getSelectedRows();
        let stringifedRows = JSON.stringify(rows);
        this.selectedAccountRecords = [...JSON.parse(stringifedRows)];
        console.log('about to enterupdate');
        this.selectedAccountRecords.forEach(rec => this.updateAccounts(rec));
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
