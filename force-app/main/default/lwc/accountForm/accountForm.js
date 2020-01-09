import { LightningElement, track, wire} from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';   

export default class createRecordForm extends LightningElement {
   @track accountId;
   @wire(CurrentPageReference) pageRef;

   handleSubmit(event) {
       //event.stopPropagation();
       event.preventDefault();
       this.accountId = event.detail.id;
       console.log(JSON.stringify(event.detail.fields));
       fireEvent(this.pageRef, 'dataSubmit', JSON.stringify(event.detail.fields));
   }
}