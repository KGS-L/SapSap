import { Component, EventEmitter, inject, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CampaignBusinessService } from '../../../core/services/campaign-business.service';
import { CreateCampaignDto, QuestionnaireField, PayCampaignDto } from '../../../core/models/campaign.model';

export interface MissionTypeOption {
  id: 'verification' | 'audit' | 'mystery_shopper' | 'pricing';
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  defaultReward: number;
}

@Component({
  selector: 'app-campaign-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaign-wizard.component.html',
  styleUrl: './campaign-wizard.component.css'
})
export class CampaignWizardComponent {
  private readonly campaignService = inject(CampaignBusinessService);

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<number>();

  // Stepper : 1 -> 2 -> 3 -> 4 -> 5
  currentStep = signal<number>(1);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  createdCampaignId = signal<number | null>(null);

  // Étape 1 : Infos Générales & Type
  title = signal<string>('');
  description = signal<string>('');
  missionType = signal<'verification' | 'audit' | 'mystery_shopper' | 'pricing'>('audit');

  readonly missionTypes: MissionTypeOption[] = [
    {
      id: 'audit',
      title: 'Audit de Présence & PLV',
      subtitle: 'Contrôle des affiches, frigos, bannières et conformité de marque.',
      icon: '🏪',
      badge: 'Très populaire',
      defaultReward: 2500
    },
    {
      id: 'pricing',
      title: 'Relevé de Prix & Stocks',
      subtitle: 'Veille concurrentielle sur les tarifs et disponibilité en rayons.',
      icon: '🏷️',
      badge: 'Rapide',
      defaultReward: 2000
    },
    {
      id: 'mystery_shopper',
      title: 'Client Mystère & Qualité',
      subtitle: 'Évaluation de l\'accueil, du service et de l\'expérience client.',
      icon: '🕵️',
      badge: 'Haute valeur',
      defaultReward: 3500
    },
    {
      id: 'verification',
      title: 'Vérification de Point de Vente',
      subtitle: 'Validation d\'existence, géolocalisation et horaires d\'ouverture.',
      icon: '📍',
      badge: 'Essentiel',
      defaultReward: 1500
    }
  ];

  // Étape 2 : Ciblage géographique & Volume
  city = signal<string>('Ouagadougou');
  selectedNeighborhoods = signal<string[]>(['Koulouba', 'Ouaga 2000']);
  allNeighborhoods = this.campaignService.getOuagadougouNeighborhoods();
  totalMissions = signal<number>(20);
  requiredPhotosCount = signal<number>(2);

  // Étape 3 : Constructeur de Questionnaire
  questions = signal<QuestionnaireField[]>([
    {
      id: 'q1',
      label: 'La marque ou le produit est-il clairement visible sur le lieu de vente ?',
      type: 'boolean',
      required: true,
      help_text: 'Vérifier la vitrine et l\'enseigne principale'
    },
    {
      id: 'q2',
      label: 'Quel est le prix unitaire constaté en rayon (en FCFA) ?',
      type: 'number',
      required: true,
      help_text: 'Saisir le montant exact sans symbole'
    },
    {
      id: 'q3',
      label: 'État de propreté et fonctionnement des équipements de la marque',
      type: 'select',
      required: true,
      options: ['Excellent / Neuf', 'Bon état fonctionnel', 'Dégradé / Nécessite maintenance', 'Absent ou non opérationnel'],
      help_text: 'Sélectionner l\'état constaté sur place'
    }
  ]);

  newQuestionLabel = signal<string>('');
  newQuestionType = signal<'text' | 'select' | 'number' | 'boolean' | 'photo'>('text');
  newQuestionRequired = signal<boolean>(true);
  newQuestionOptionsStr = signal<string>('Option 1, Option 2, Option 3');

  // Étape 4 : Devis & Budget
  rewardPerMission = signal<number>(2500);
  commissionRate = 0.15; // 15% SapSap platform fee

  readonly subtotal = computed(() => {
    return this.rewardPerMission() * this.totalMissions();
  });

  readonly platformFee = computed(() => {
    return Math.round(this.subtotal() * this.commissionRate);
  });

  readonly totalBudget = computed(() => {
    return this.subtotal() + this.platformFee();
  });

  // Étape 5 : Paiement & Séquestre Mobile Money
  paymentMethod = signal<'orange_money' | 'moov_money'>('orange_money');
  phoneNumber = signal<string>('+22670123456');

  // Navigation
  goToStep(step: number): void {
    this.errorMessage.set(null);
    if (step > this.currentStep()) {
      if (!this.validateStep(this.currentStep())) {
        return;
      }
    }
    this.currentStep.set(step);
  }

  nextStep(): void {
    if (this.validateStep(this.currentStep())) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    this.errorMessage.set(null);
    this.currentStep.update(s => Math.max(1, s - 1));
  }

  selectMissionType(type: 'verification' | 'audit' | 'mystery_shopper' | 'pricing'): void {
    this.missionType.set(type);
    const found = this.missionTypes.find(t => t.id === type);
    if (found) {
      this.rewardPerMission.set(found.defaultReward);
    }
  }

  toggleNeighborhood(nh: string): void {
    const list = this.selectedNeighborhoods();
    if (list.includes(nh)) {
      if (list.length > 1) {
        this.selectedNeighborhoods.set(list.filter(item => item !== nh));
      }
    } else {
      this.selectedNeighborhoods.set([...list, nh]);
    }
  }

  selectAllNeighborhoods(): void {
    this.selectedNeighborhoods.set([...this.allNeighborhoods]);
  }

  resetNeighborhoods(): void {
    this.selectedNeighborhoods.set(['Koulouba', 'Ouaga 2000']);
  }

  // Questionnaire builder
  addQuestion(): void {
    const label = this.newQuestionLabel().trim();
    if (!label) {
      this.errorMessage.set('Veuillez renseigner le libellé de la question.');
      return;
    }

    const type = this.newQuestionType();
    const newField: QuestionnaireField = {
      id: 'q_' + Date.now(),
      label,
      type,
      required: this.newQuestionRequired(),
      options: type === 'select' 
        ? this.newQuestionOptionsStr().split(',').map(s => s.trim()).filter(s => s.length > 0)
        : undefined
    };

    this.questions.update(q => [...q, newField]);
    this.newQuestionLabel.set('');
    this.newQuestionOptionsStr.set('Option 1, Option 2, Option 3');
    this.errorMessage.set(null);
  }

  removeQuestion(index: number): void {
    this.questions.update(q => q.filter((_, i) => i !== index));
  }

  // Validation par étape
  validateStep(step: number): boolean {
    this.errorMessage.set(null);

    if (step === 1) {
      if (!this.title().trim()) {
        this.errorMessage.set('Veuillez donner un titre explicite à votre campagne.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (this.selectedNeighborhoods().length === 0) {
        this.errorMessage.set('Veuillez sélectionner au moins un quartier cible à Ouagadougou.');
        return false;
      }
      if (this.totalMissions() < 1) {
        this.errorMessage.set('Le nombre total de missions doit être d\'au moins 1.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (this.questions().length === 0) {
        this.errorMessage.set('Veuillez définir au moins une question ou consigne de validation.');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (this.rewardPerMission() < 500) {
        this.errorMessage.set('La rémunération minimale par mission est de 500 FCFA.');
        return false;
      }
      return true;
    }

    return true;
  }

  // Soumission & Création
  submitCampaign(): void {
    if (!this.validateStep(4)) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: CreateCampaignDto = {
      title: this.title().trim(),
      description: this.description().trim() || `Campagne de ${this.missionType()} à Ouagadougou`,
      mission_type: this.missionType(),
      location_city: this.city(),
      target_district: this.selectedNeighborhoods().join(', '),
      questionnaire_schema: this.questions(),
      required_photos_count: this.requiredPhotosCount(),
      total_missions_requested: this.totalMissions(),
      reward_per_mission: this.rewardPerMission()
    };

    this.campaignService.createCampaign(payload).subscribe({
      next: res => {
        const campId = res.data?.id || Date.now();
        this.createdCampaignId.set(campId);
        // Processus de paiement séquestre
        this.processPayment(campId);
      },
      error: err => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Impossible de créer la campagne. Veuillez vérifier vos données.');
      }
    });
  }

  processPayment(campaignId: number): void {
    const paymentDto: PayCampaignDto = {
      payment_method: this.paymentMethod(),
      phone_number: this.phoneNumber().trim()
    };

    this.campaignService.payCampaign(campaignId, paymentDto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Campagne créée avec succès et budget sécurisé sous séquestre !');
        this.currentStep.set(5);
        this.created.emit(campaignId);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.currentStep.set(5);
        this.created.emit(campaignId);
      }
    });
  }

  formatPrice(amount?: number): string {
    return (amount || 0).toLocaleString('fr-FR');
  }

  closeModal(): void {
    this.close.emit();
  }
}
