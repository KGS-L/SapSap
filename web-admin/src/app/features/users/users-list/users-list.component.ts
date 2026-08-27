import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserAdminService } from '../../../core/services/user-admin.service';
import { AdminUserItem, UserDetailResponse } from '../../../core/models/user-admin.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit {
  readonly userService = inject(UserAdminService);

  selectedRole = 'all';
  searchQuery = '';
  selectedStatus = 'all';

  // Modal d'édition de rôle
  selectedUserForEdit = signal<AdminUserItem | null>(null);
  newRoleSelection = signal<string>('validator');

  // Feedback Toast
  readonly toast = signal<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.loadUsers(this.selectedRole, this.searchQuery, this.selectedStatus).subscribe();
  }

  onRoleFilterChange(role: string): void {
    this.selectedRole = role;
    this.loadUsers();
  }

  onSearchChange(): void {
    this.loadUsers();
  }

  openRoleModal(user: AdminUserItem): void {
    this.selectedUserForEdit.set(user);
    this.newRoleSelection.set(user.role);
  }

  closeRoleModal(): void {
    this.selectedUserForEdit.set(null);
  }

  saveRoleChange(): void {
    const user = this.selectedUserForEdit();
    if (!user) return;

    this.userService.updateRole(user.id, this.newRoleSelection()).subscribe({
      next: (res: UserDetailResponse) => {
        this.showToast(res.message || 'Rôle mis à jour avec succès.', 'success');
        this.closeRoleModal();
        this.loadUsers();
      },
      error: () => {
        this.showToast('Erreur lors de la mise à jour du rôle.', 'error');
      }
    });
  }

  onToggleStatus(user: AdminUserItem): void {
    this.userService.toggleStatus(user.id).subscribe({
      next: (res: any) => {
        this.showToast(res.message || 'Statut mis à jour.', 'success');
      },
      error: () => {
        this.showToast('Erreur lors du changement de statut.', 'error');
      }
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Jamais';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toast.set({ message, type });
    setTimeout(() => {
      this.toast.set(null);
    }, 4000);
  }
}
