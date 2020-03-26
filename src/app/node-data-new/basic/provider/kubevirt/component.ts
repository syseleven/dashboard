import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';

import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {DigitaloceanSizes} from '../../../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  CPUs = 'cpus',
  Memory = 'memory',
  Namespace = 'namespace',
  SourceURL = 'sourceURL',
  StorageClassName = 'storageClassName',
  PVCSize = 'pvcSize',
}

@Component({
  selector: 'km-kubevirt-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => KubeVirtBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => KubeVirtBasicNodeDataComponent), multi: true}
  ]
})
export class KubeVirtBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  sizes: DigitaloceanSizes = {optimized: [], standard: []};
  filteredSizes: DigitaloceanSizes = {optimized: [], standard: []};
  hideOptional = false;

  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.CPUs]: this._builder.control(
          '1',
          [
            Validators.required,
            Validators.pattern(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/),
          ]),
      [Controls.Memory]: this._builder.control(
          '2Gi',
          [
            Validators.required,
            Validators.pattern(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/),
          ]),
      [Controls.Namespace]: this._builder.control('', Validators.required),
      [Controls.SourceURL]: this._builder.control('', Validators.required),
      [Controls.StorageClassName]: this._builder.control('', Validators.required),
      [Controls.PVCSize]: this._builder.control(
          '10Gi',
          [
            Validators.required,
            Validators.pattern(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/),
          ]),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._nodeDataService.nodeData = this._getNodeData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  isInWizard(): boolean {
    return this._nodeDataService.isInWizardMode();
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          kubevirt: {
            cpus: this.form.get(Controls.CPUs).value,
            memory: this.form.get(Controls.Memory).value,
            namespace: this.form.get(Controls.Namespace).value,
            sourceURL: this.form.get(Controls.SourceURL).value,
            storageClassName: this.form.get(Controls.StorageClassName).value,
            pvcSize: this.form.get(Controls.PVCSize).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}