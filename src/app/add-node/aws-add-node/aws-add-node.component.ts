import { InputValidationService } from './../../core/services/input-validation/input-validation.service';
import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NodeSpec } from './../../shared/entity/NodeEntity';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { WizardActions } from '../../redux/actions/wizard.actions';
import { NodeInstanceFlavors } from '../../shared/model/NodeProviderConstants';

@Component({
  selector: 'kubermatic-aws-add-node',
  templateUrl: './aws-add-node.component.html',
  styleUrls: ['./aws-add-node.component.scss']
})
export class AwsAddNodeComponent implements OnInit, OnDestroy {

  @Output() public nodeSpecChanges: EventEmitter<NodeSpec> = new EventEmitter();
  @Output() public formChanges: EventEmitter<FormGroup> = new EventEmitter();

  public awsNodeForm: FormGroup;
  public nodeSize: any[] = NodeInstanceFlavors.AWS;
  public nodeSpec: NodeSpec;
  @select(['wizard', 'isCheckedForm']) isChecked$: Observable<boolean>;
  @select(['wizard', 'nodeForm']) nodeForm$: Observable<any>;
  public nodeForm: any;
  private subscriptions: Subscription[] = [];

  constructor(private formBuilder: FormBuilder,
              private ngRedux: NgRedux<any>,
              public inputValidationService: InputValidationService) { }

  ngOnInit() {
    const subIsChecked = this.isChecked$.subscribe(isChecked => {
      isChecked && this.showRequiredFields();
    });
    this.subscriptions.push(subIsChecked);

    const subNodeForm = this.nodeForm$.subscribe(nodeForm => {
      nodeForm && (this.nodeForm = nodeForm);
    });
    this.subscriptions.push(subNodeForm);

    this.awsNodeForm = this.formBuilder.group({
      node_count: [3, [<any>Validators.required, Validators.min(1)]],
      node_size: ['t2.medium', [<any>Validators.required]],
      root_size: [20, [Validators.required, Validators.min(10), Validators.max(16000)]],
      ami: [''],
      aws_nas: [false]
    });

    if (this.nodeForm) {
      const formValue = {
        node_count: this.nodeForm.node_count,
        node_size: this.nodeForm.node_size,
        root_size: this.nodeForm.root_size,
        ami: this.nodeForm.ami,
        aws_nas: this.nodeForm.aws_nas
      };

      this.awsNodeForm.setValue(formValue);
    }

    this.onChange();
  }

  public showRequiredFields() {
    if (this.awsNodeForm.invalid) {
      for (const i in this.awsNodeForm.controls) {
        if (this.awsNodeForm.controls.hasOwnProperty(i)) {
          this.awsNodeForm.get(i).markAsTouched();
        }
      }
    }
  }

  public onChange() {

    WizardActions.formChanged(
      ['wizard', 'nodeForm'],
      {
        node_size: this.awsNodeForm.controls['node_size'].value,
        root_size: this.awsNodeForm.controls['root_size'].value,
        node_count: this.awsNodeForm.controls['node_count'].value,
        ami: this.awsNodeForm.controls['ami'].value,
        aws_nas: this.awsNodeForm.controls['aws_nas'].value
      },
      this.awsNodeForm.valid
    );

    if (this.nodeForm) {
      if (this.awsNodeForm.valid) {
        const nodeSpec: NodeSpec = {
          cloud: {
            aws: {
              instanceType: this.nodeForm.node_size,
              diskSize: this.nodeForm.root_size,
              volumeType: 'gp2',
              ami: this.nodeForm.ami,
              tags: new Map<string, string>(),
            },
          },
          operatingSystem: {
            ubuntu: {
              distUpgradeOnBoot: false,
            },
          },
        };

        this.nodeSpecChanges.emit(nodeSpec);
        this.formChanges.emit(this.awsNodeForm);
      }
    }
  }


  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
