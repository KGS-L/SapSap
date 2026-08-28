import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private currentPositionSubject = new BehaviorSubject<Coordinates>(environment.defaultLocation);
  public currentPosition$ = this.currentPositionSubject.asObservable();

  private isWatching = false;
  private watchId: string | null = null;

  constructor() {
    this.refreshPosition();
  }

  /**
   * Actualiser la position GPS actuelle
   */
  public async refreshPosition(): Promise<Coordinates> {
    try {
      // Tenter de récupérer la position GPS native
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000
      });

      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      this.currentPositionSubject.next(coords);
      return coords;
    } catch (err) {
      console.warn('GPS introuvable ou non disponible, utilisation des coordonnées par défaut de Ouagadougou:', err);
      const defaultCoords: Coordinates = environment.defaultLocation;
      this.currentPositionSubject.next(defaultCoords);
      return defaultCoords;
    }
  }

  /**
   * Obtenir la dernière position connue
   */
  public getCurrentCoordinates(): Coordinates {
    return this.currentPositionSubject.value;
  }

  /**
   * Formule Haversine pour calculer la distance exacte en mètres entre deux points GPS
   */
  public calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Calculer la distance en kilomètres
   */
  public calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const meters = this.calculateDistanceMeters(lat1, lon1, lat2, lon2);
    return Math.round((meters / 1000) * 10) / 10;
  }

  /**
   * Vérifier si l'utilisateur est dans le rayon de tolérance GPS autorisé (<100m)
   */
  public isWithinRadius(
    targetLat: number,
    targetLng: number,
    radiusMeters: number = 100
  ): { withinRadius: boolean; distanceMeters: number } {
    const current = this.getCurrentCoordinates();
    const distanceMeters = this.calculateDistanceMeters(
      current.latitude,
      current.longitude,
      targetLat,
      targetLng
    );

    return {
      withinRadius: distanceMeters <= radiusMeters,
      distanceMeters: distanceMeters
    };
  }

  /**
   * Formater lisiblement une distance pour l'interface contributeur
   */
  public formatDistance(distanceMeters: number): string {
    if (distanceMeters < 1000) {
      return `${distanceMeters} m`;
    }
    const km = (distanceMeters / 1000).toFixed(1);
    return `${km} km`;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
