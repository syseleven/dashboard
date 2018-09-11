import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../redux/actions/notification.actions';
import { ApiService, ProjectService } from '../../core/services';
import { CreateMemberEntity, MemberProject } from '../../shared/entity/MemberEntity';
import { ProjectEntity } from '../../shared/entity/ProjectEntity';
import { MemberEntity } from '../../shared/entity/MemberEntity';

@Component({
  selector: 'kubermatic-edit-member',
  templateUrl: './edit-member.component.html',
  styleUrls: ['./edit-member.component.scss']
})
export class EditMemberComponent implements OnInit {
  @Input() project: ProjectEntity;
  @Input() member: MemberEntity;
  public editMemberForm: FormGroup;

  constructor(private api: ApiService,
              private projectService: ProjectService,
              private dialogRef: MatDialogRef<EditMemberComponent>) {
  }

  public ngOnInit() {
    this.editMemberForm = new FormGroup({
      group: new FormControl('', [Validators.required]),
    });
  }

  editMember(): void {
    const createMember: CreateMemberEntity = {
      email: this.member.email,
      projects: [
        {
          group: this.editMemberForm.controls.group.value,
          id: this.project.id,
        }
      ]
    };

    this.api.createMembers(this.project.id, createMember).subscribe(res => {
      this.dialogRef.close(true);
      NotificationActions.success('Success', `Member is edited successfully`);
    });
  }
}