import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminStatsService } from '../../core/services/admin-stats.service';
import { CampaignAdminService } from '../../core/services/campaign-admin.service';
import { SubmissionAdminService } from '../../core/services/submission-admin.service';
import { Campaign } from '../../core/models/campaign.model';
import { Submission } from '../../core/models/submission.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  readonly statsService = inject(AdminStatsService);
  readonly campaignService = inject(CampaignAdminService);
  readonly submissionService = inject(SubmissionAdminService);

  ngOnInit(): void {
    this.campaignService.loadCampaigns().subscribe();
    this.submissionService.loadSubmissions().subscribe();
  }

  get pendingCampaigns(): Campaign[] {
    return this.campaignService.campaigns().filter(c => c.status === 'pending');
  }

  get recentSubmissionsList(): Submission[] {
    return this.submissionService.submissions();
  }

  onApprove(campaign: Campaign): void {
    this.campaignService.approveCampaign(campaign.id).subscribe();
  }

  onValidateSubmission(sub: Submission): void {
    this.submissionService.validateSubmission(sub.id).subscribe();
  }

  formatPrice(amount?: number): string {
    return (amount || 0).toLocaleString('fr-FR');
  }
}
