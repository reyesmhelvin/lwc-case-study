import { LightningElement, track, wire} from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners, fireEvent } from 'c/pubsub';   

export default class createRecordForm extends LightningElement {
   @track accountId;
   @track recordId;
   @track type;
   @track name;
   @track industry;

   @track isEditMode = false;

   @wire(CurrentPageReference) pageRef;

   handleSubmit(event) {
       event.preventDefault();
       this.accountId = event.detail.id;
       if (this.isEditMode) {
        let parsedData = JSON.stringify(event.detail.fields);
        let stringifiedData = JSON.parse(parsedData);
        stringifiedData.Id = this.recordId
        fireEvent(this.pageRef, 'dataEdit', stringifiedData);
       } else {
        fireEvent(this.pageRef, 'dataSubmit', JSON.stringify(event.detail.fields));
       }
       this.handleReset();
   }

    connectedCallback() {
        registerListener('editData', this.handleEditData, this);
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    handleEditData(editData) {
        let data = JSON.parse(editData);
        this.recordId = data.Id;
        this.name = data.Name;
        this.type = data.Type;
        this.industry = data.Industry;
        this.isEditMode = true;
    }

    handleReset(event) {
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        this.isEditMode = false;
        this.name = '';
        this.industry = '';
        this.type = '';
     }
     
}