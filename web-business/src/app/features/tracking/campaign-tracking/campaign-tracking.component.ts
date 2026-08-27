import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CampaignBusinessService } from '../../../core/services/campaign-business.service';
import { ResultPoint, TrackingData } from '../../../core/models/campaign.model';

@Component({
  selector: 'app-campaign-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './campaign-tracking.component.html',
  styleUrl: './campaign-tracking.component.css'
})
export class CampaignTrackingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly campaignService = inject(CampaignBusinessService);

  campaignId = signal<number>(1);
  activeStatusFilter = signal<'all' | 'validated' | 'submitted' | 'reserved' | 'available'>('all');
  selectedNeighborhood = signal<string>('all');
  searchQuery = signal<string>('');
  viewMode = signal<'map' | 'grid'>('map');

  // Inspection Drawer & Photo Zoom
  selectedPoint = signal<ResultPoint | null>(null);
  isDrawerOpen = signal<boolean>(false);
  zoomedPhoto = signal<string | null>(null);

  // Map Bounds for Ouagadougou projection
  // Ouagadougou bounding box: Lat [12.28, 12.44], Lng [-1.58, -1.46]
  readonly mapBounds = {
    minLat: 12.29,
    maxLat: 12.43,
    minLng: -1.57,
    maxLng: -1.47
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const numId = id ? parseInt(id, 10) : 1;
      this.campaignId.set(numId);
      this.loadData();
    });
  }

  loadData(): void {
    const id = this.campaignId();
    this.campaignService.loadTracking(id).subscribe();
    this.campaignService.loadResultsMap(id).subscribe(res => {
      // Auto-select first validated point for preview drawer if available
      const validated = res.data.find(p => p.status === 'validated');
      if (validated && !this.selectedPoint()) {
        this.selectedPoint.set(validated);
      }
    });
  }

  onCampaignChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newId = parseInt(select.value, 10);
    this.campaignId.set(newId);
    this.selectedPoint.set(null);
    this.loadData();
  }

  setStatusFilter(status: 'all' | 'validated' | 'submitted' | 'reserved' | 'available'): void {
    this.activeStatusFilter.set(status);
  }

  setNeighborhoodFilter(nh: string): void {
    this.selectedNeighborhood.set(nh);
  }

  // Filtrage réactif des points
  readonly filteredPoints = computed(() => {
    const list = this.campaignService.currentResultsMap();
    const status = this.activeStatusFilter();
    const nh = this.selectedNeighborhood();
    const query = this.searchQuery().toLowerCase().trim();

    return list.filter(point => {
      // Filtre statut
      if (status !== 'all' && point.status !== status) {
        return false;
      }
      // Filtre quartier
      if (nh !== 'all' && !point.location_name.toLowerCase().includes(nh.toLowerCase())) {
        return false;
      }
      // Recherche texte
      if (query) {
        const matchTitle = point.title.toLowerCase().includes(query);
        const matchLoc = point.location_name.toLowerCase().includes(query);
        const matchContributor = point.assigned_user?.name.toLowerCase().includes(query) || false;
        if (!matchTitle && !matchLoc && !matchContributor) {
          return false;
        }
      }
      return true;
    });
  });

  // Calcul du positionnement cartographique en pourcentage (Projection Ouagadougou)
  getPointPosition(point: ResultPoint): { left: string; top: string } {
    const lat = point.latitude;
    const lng = point.longitude;

    // Normalisation 0% -> 100%
    const x = ((lng - this.mapBounds.minLng) / (this.mapBounds.maxLng - this.mapBounds.minLng)) * 100;
    // L'axe Y est inversé (Nord en haut = latitude max en top: 0%)
    const y = ((this.mapBounds.maxLat - lat) / (this.mapBounds.maxLat - this.mapBounds.minLat)) * 100;

    // Bornage de sécurité pour rester dans le cadre
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(8, Math.min(92, y));

    return {
      left: `${clampedX.toFixed(2)}%`,
      top: `${clampedY.toFixed(2)}%`
    };
  }

  selectPoint(point: ResultPoint): void {
    this.selectedPoint.set(point);
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  openZoom(photoUrl: string): void {
    this.zoomedPhoto.set(photoUrl);
  }

  closeZoom(): void {
    this.zoomedPhoto.set(null);
  }

  selectNextPoint(): void {
    const list = this.filteredPoints();
    const current = this.selectedPoint();
    if (!current || list.length === 0) return;

    const currentIndex = list.findIndex(p => p.id === current.id);
    const nextIndex = (currentIndex + 1) % list.length;
    this.selectedPoint.set(list[nextIndex]);
  }

  selectPrevPoint(): void {
    const list = this.filteredPoints();
    const current = this.selectedPoint();
    if (!current || list.length === 0) return;

    const currentIndex = list.findIndex(p => p.id === current.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    this.selectedPoint.set(list[prevIndex]);
  }

  getAnswerEntries(answers?: Record<string, string>): { key: string; value: string }[] {
    if (!answers) return [];
    return Object.entries(answers).map(([key, value]) => ({ key, value }));
  }

  formatPrice(amount?: number): string {
    return (amount || 0).toLocaleString('fr-FR');
  }
}
