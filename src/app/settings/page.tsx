import MainLayout from '@/components/layout/MainLayout'

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
          <p className="text-gray-600">Manage your profile information</p>
        </section>
        
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <p className="text-gray-600">Configure your notification preferences</p>
        </section>
        
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <p className="text-gray-600">Account and security settings</p>
        </section>
      </div>
      </div>
    </MainLayout>
  )
}