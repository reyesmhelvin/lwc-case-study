import { LightningElement, track, wire} from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners, fireEvent } from 'c/pubsub';   

export default class createRecordForm extends LightningElement {
   @track accountId;
   @track recordId;
   @track type;
   @track industry;

   @track isEditMode = false;

   @wire(CurrentPageReference) pageRef;

   handleSubmit(event) {
       event.preventDefault();
       console.log(this.isEditMode);
       this.accountId = event.detail.id;
       if (this.isEditMode) {
        let parsedData = JSON.stringify(event.detail.fields);
        let stringifiedData = JSON.parse(parsedData);
        console.log('modifiedData',stringifiedData);
        stringifiedData.Id = this.recordId
        console.log('modifiedData id',stringifiedData);
        fireEvent(this.pageRef, 'dataEdit', stringifiedData);
       } else {
        fireEvent(this.pageRef, 'dataSubmit', JSON.stringify(event.detail.fields));
       }
   }

    connectedCallback() {
        registerListener('editData', this.handleEditData, this);
        console.log('this.recordTypeId',this.recordTypeId);
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    handleEditData(editData) {
        let data = JSON.parse(editData);
        this.recordId = data.Id;
        this.type = data.Type;
        this.industry = data.Industry;
        this.isEditMode = true;
    }
}