import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { MissionService } from '../../core/services/mission.service';
import { GeolocationService, Coordinates } from '../../core/services/geolocation.service';
import { AuthService } from '../../core/services/auth.service';
import { Mission } from '../../core/models/mission.model';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
  standalone: false
})
export class ExplorePage implements OnInit {
  missions: Mission[] = [];
  filteredMissions: Mission[] = [];
  selectedMission: Mission | null = null;
  currentCoords: Coordinates | null = null;

  isLoading = true;
  viewMode: 'list' | 'map' = 'list';
  searchQuery = '';
  selectedCategory = 'all';

  categories = [
    { id: 'all', label: 'Toutes', icon: 'grid-outline' },
    { id: 'price_check', label: 'Prix & Stocks', icon: 'pricetag-outline' },
    { id: 'presence_audit', label: 'Audit Boutique', icon: 'storefront-outline' },
    { id: 'mystery_shopper', label: 'Client Mystère', icon: 'eye-outline' }
  ];

  constructor(
    private missionService: MissionService,
    private geo: GeolocationService,
    public authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.loadMissions();
  }

  ionViewWillEnter(): void {
    this.currentCoords = this.geo.getCurrentCoordinates();
    this.loadMissions();
  }

  loadMissions(event?: any): void {
    this.isLoading = true;
    this.geo.refreshPosition().then(coords => {
      this.currentCoords = coords;

      this.missionService.getAvailableMissions(coords.latitude, coords.longitude).subscribe({
        next: (res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            this.missions = res.data;
          } else {
            // Missions par défaut représentatives de Ouagadougou
            this.missions = this.getMockOuagadougouMissions();
          }
          this.applyFilters();
          this.isLoading = false;
          if (event) event.target.complete();
        },
        error: (err) => {
          console.warn('Erreur chargement missions, bascule sur les missions locales:', err);
          this.missions = this.getMockOuagadougouMissions();
          this.applyFilters();
          this.isLoading = false;
          if (event) event.target.complete();
        }
      });
    });
  }

  applyFilters(): void {
    let result = [...this.missions];

    if (this.selectedCategory !== 'all') {
      result = result.filter(m => (m.mission_type || m.category) === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.district && m.district.toLowerCase().includes(q)) ||
        (m.campaign && m.campaign.title.toLowerCase().includes(q))
      );
    }

    this.filteredMissions = result;
    if (this.filteredMissions.length > 0 && !this.selectedMission) {
      this.selectedMission = this.filteredMissions[0];
    }
  }

  selectCategory(catId: string): void {
    this.selectedCategory = catId;
    this.applyFilters();
  }

  toggleViewMode(mode: 'list' | 'map'): void {
    this.viewMode = mode;
  }

  selectMission(mission: Mission): void {
    this.selectedMission = mission;
  }

  openMissionDetail(mission: Mission): void {
    this.router.navigate(['/mission-detail', mission.id], {
      state: { mission }
    });
  }

  getCategoryLabel(type?: string): string {
    switch (type) {
      case 'price_check': return 'Relevé de prix';
      case 'presence_audit': return 'Audit de présence';
      case 'mystery_shopper': return 'Client mystère';
      default: return 'Collecte terrain';
    }
  }

  private getMockOuagadougouMissions(): Mission[] {
    return [
      {
        id: 101,
        campaign_id: 1,
        title: 'Vérification prix Sucre & Huile — Alimentation Somgandé',
        description: 'Vérifiez les prix affichés en rayon pour le bidon d\'huile Dinor 5L et le paquet de sucre SN SOSUCO 1kg.',
        mission_type: 'price_check',
        reward_amount: 1500,
        latitude: 12.385420,
        longitude: -1.508700,
        address: 'Rue 14.45, Marché de Somgandé',
        district: 'Somgandé',
        radius_meters: 100,
        required_photos_count: 2,
        status: 'available',
        distance_km: 0.8,
        distance_meters: 820,
        campaign: { id: 1, title: 'Baromètre Produits de Première Nécessité', location_city: 'Ouagadougou' },
        guidelines: [
          'Prendre une photo nette de l\'étiquette de prix',
          'Vérifier que le produit est bien en stock',
          'Prendre une photo de la devanture de l\'alimentation'
        ]
      },
      {
        id: 102,
        campaign_id: 2,
        title: 'Audit présence affichage Télécom — Koulouba',
        description: 'Contrôlez la présence de la bâche publicitaire "Forfait Flash" sur le kiosque de transfert d\'argent.',
        mission_type: 'presence_audit',
        reward_amount: 2000,
        latitude: 12.368900,
        longitude: -1.524500,
        address: 'Avenue Kwame Nkrumah, Koulouba',
        district: 'Koulouba',
        radius_meters: 100,
        required_photos_count: 1,
        status: 'available',
        distance_km: 1.2,
        distance_meters: 1200,
        campaign: { id: 2, title: 'Audit Visibilité Campagne Rentrée', location_city: 'Ouagadougou' },
        guidelines: [
          'Prendre la photo de face incluant l\'enseigne',
          'Noter si la bâche est endommagée ou masquée'
        ]
      },
      {
        id: 103,
        campaign_id: 3,
        title: 'Client Mystère — Accueil & Disponibilité SIM à Gounghin',
        description: 'Demandez l\'achat d\'une nouvelle carte SIM et évaluez le temps d\'attente et la courtoisie de l\'agent.',
        mission_type: 'mystery_shopper',
        reward_amount: 3500,
        latitude: 12.355100,
        longitude: -1.545200,
        address: 'Boulevard de la Jeunesse, Gounghin',
        district: 'Gounghin',
        radius_meters: 100,
        required_photos_count: 2,
        status: 'available',
        distance_km: 3.4,
        distance_meters: 3400,
        campaign: { id: 3, title: 'Contrôle Qualité Expérience Client', location_city: 'Ouagadougou' },
        guidelines: [
          'Mesurer le temps d\'attente en minutes',
          'Prendre une photo du ticket de caisse ou du reçu'
        ]
      },
      {
        id: 104,
        campaign_id: 4,
        title: 'Relevé stock Boissons Énergisantes — Ouaga 2000',
        description: 'Compter le nombre de canettes fraîches en vitrine réfrigérée dans la superette.',
        mission_type: 'price_check',
        reward_amount: 1800,
        latitude: 12.331200,
        longitude: -1.512300,
        address: 'Avenue Pascal Zagré, Ouaga 2000',
        district: 'Ouaga 2000',
        radius_meters: 100,
        required_photos_count: 2,
        status: 'available',
        distance_km: 4.8,
        distance_meters: 4800,
        campaign: { id: 4, title: 'Audit Distribution Boissons', location_city: 'Ouagadougou' },
        guidelines: [
          'Photographier l\'ensemble du rayon boissons fraîches'
        ]
      }
    ];
  }
}
