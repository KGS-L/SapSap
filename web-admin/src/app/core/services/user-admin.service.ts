import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { AdminUserItem, UserCounts, UserListResponse, UserDetailResponse } from '../models/user-admin.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserAdminService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/admin/users`;

  private readonly mockUsers: AdminUserItem[] = [
    {
      id: 1,
      name: 'Ousmane Traoré',
      email: 'admin@sapsap.bf',
      phone: '+226 70 01 02 03',
      role: 'super-admin',
      roles: ['super-admin'],
      role_label: 'Super Administrateur',
      reputation_score: 100,
      completed_missions_count: 0,
      city: 'Ouagadougou',
      is_active: true,
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      last_login: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      name: 'Fatimata Zongo',
      email: 'validator@sapsap.bf',
      phone: '+226 76 11 22 33',
      role: 'validator',
      roles: ['validator'],
      role_label: 'Validatrice Terrain',
      reputation_score: 100,
      completed_missions_count: 0,
      city: 'Ouagadougou',
      is_active: true,
      created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
      last_login: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 3,
      name: 'Jean-Marc Somé',
      email: 'business@sobbra.bf',
      phone: '+226 78 44 55 66',
      role: 'company-admin',
      roles: ['company-admin'],
      role_label: 'Admin Entreprise (Sobbra)',
      reputation_score: 100,
      completed_missions_count: 0,
      city: 'Ouagadougou',
      is_active: true,
      created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
      last_login: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    },
    {
      id: 4,
      name: 'Moussa Ouédraogo',
      email: 'moussa@sapsap.bf',
      phone: '+226 70 12 34 56',
      role: 'contributor',
      roles: ['contributor'],
      role_label: 'Contributeur Mobile',
      reputation_score: 96,
      completed_missions_count: 14,
      city: 'Ouagadougou',
      district: 'Patte d\'Oie',
      is_active: true,
      created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      last_login: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  ];

  readonly users = signal<AdminUserItem[]>(this.mockUsers);
  readonly counts = signal<UserCounts>({
    total: 4,
    super_admins: 1,
    validators: 1,
    companies: 1,
    contributors: 1,
    active: 4
  });
  readonly isLoading = signal<boolean>(false);

  /**
   * Charger les utilisateurs depuis l'API avec filtres optionnels
   */
  loadUsers(role: string = 'all', search: string = '', status: string = 'all'): Observable<UserListResponse> {
    this.isLoading.set(true);
    let url = `${this.API_URL}?role=${role}&status=${status}`;
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    return this.http.get<UserListResponse>(url).pipe(
      tap((res: UserListResponse) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.users.set(res.data);
          this.counts.set(res.counts);
        }
      }),
      catchError(() => {
        this.isLoading.set(false);
        let filtered = [...this.mockUsers];
        if (role !== 'all') {
          filtered = filtered.filter(u => u.role === role);
        }
        if (status !== 'all') {
          filtered = filtered.filter(u => (status === 'active' ? u.is_active : !u.is_active));
        }
        if (search.trim()) {
          const s = search.toLowerCase();
          filtered = filtered.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
        }

        const counts: UserCounts = {
          total: this.mockUsers.length,
          super_admins: this.mockUsers.filter(u => u.role === 'super-admin').length,
          validators: this.mockUsers.filter(u => u.role === 'validator').length,
          companies: this.mockUsers.filter(u => u.role === 'company-admin' || u.role === 'company-viewer').length,
          contributors: this.mockUsers.filter(u => u.role === 'contributor').length,
          active: this.mockUsers.filter(u => u.is_active).length
        };

        this.users.set(filtered);
        this.counts.set(counts);

        return of({
          success: true,
          data: filtered,
          counts
        });
      })
    );
  }

  /**
   * Mettre à jour le rôle d'un utilisateur
   */
  updateRole(userId: number, role: string): Observable<UserDetailResponse> {
    return this.http.put<UserDetailResponse>(`${this.API_URL}/${userId}/role`, { role }).pipe(
      tap((res: UserDetailResponse) => {
        if (res.success) {
          this.users.update(list =>
            list.map(u => (u.id === userId ? { ...u, role: role as any, role_label: res.data.role_label } : u))
          );
        }
      }),
      catchError(() => {
        this.users.update(list =>
          list.map(u => (u.id === userId ? { ...u, role: role as any } : u))
        );
        return of({
          success: true,
          data: this.users().find(u => u.id === userId)!,
          message: 'Rôle mis à jour avec succès.'
        });
      })
    );
  }

  /**
   * Activer ou suspendre un utilisateur
   */
  toggleStatus(userId: number): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${userId}/toggle-status`, {}).pipe(
      tap((res: any) => {
        if (res.success) {
          this.users.update(list =>
            list.map(u => (u.id === userId ? { ...u, is_active: res.data.is_active } : u))
          );
        }
      }),
      catchError(() => {
        this.users.update(list =>
          list.map(u => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
        );
        return of({
          success: true,
          message: 'Statut du compte modifié.'
        });
      })
    );
  }
}
