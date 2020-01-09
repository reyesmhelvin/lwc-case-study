import { LightningElement, track, wire} from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners, fireEvent } from 'c/pubsub';   

export default class createRecordForm extends LightningElement {
   @track accountId;
   @track recordId;

   @wire(CurrentPageReference) pageRef;

   handleSubmit(event) {
       event.preventDefault();
       this.accountId = event.detail.id;
       fireEvent(this.pageRef, 'dataSubmit', JSON.stringify(event.detail.fields));
   }

    connectedCallback() {
        registerListener('editData', this.handleEditData, this);
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    handleEditData(editData) {
        this.recordId = editData.id;
    }
}