import { Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/pages/login/LoginPage'
import { RegisterPage } from '@/pages/register/RegisterPage'
import { OverviewPage } from '@/pages/overview/OverviewPage'
import { EfficiencyPage } from '@/pages/efficiency/EfficiencyPage'
import { MastersPage } from '@/pages/masters/MastersPage'
import { MechanicsPage } from '@/pages/mechanics/MechanicsPage'
import { BrandsPage } from '@/pages/brands/BrandsPage'
import { ProtectedLayout } from '@/app/layouts/ProtectedLayout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedLayout>
            <OverviewPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/efficiency"
        element={
          <ProtectedLayout>
            <EfficiencyPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/masters"
        element={
          <ProtectedLayout>
            <MastersPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/mechanics"
        element={
          <ProtectedLayout>
            <MechanicsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/brands"
        element={
          <ProtectedLayout>
            <BrandsPage />
          </ProtectedLayout>
        }
      />
    </Routes>
  )
}

export default App
