import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthPageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./features/tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'mission-detail/:id',
    loadChildren: () => import('./features/mission-detail/mission-detail.module').then(m => m.MissionDetailPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'mission-execution/:id',
    loadChildren: () => import('./features/mission-execution/mission-execution.module').then(m => m.MissionExecutionPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'tabs'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
