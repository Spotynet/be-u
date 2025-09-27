"use client";

import {useAuth} from "@/hooks/useAuth";
import {ProtectedRoute} from "@/components/ProtectedRoute";
import {Card, CardContent, CardHeader} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {ThemeToggle} from "@/components/ThemeToggle";

export default function DashboardPage() {
  const {user, logout} = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-foreground">Be-U Dashboard</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-foreground-secondary">
                  Welcome, {user?.firstName} {user?.lastName}
                </div>
                <ThemeToggle variant="compact" />
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">Welcome to your Dashboard</h2>
              <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
                Manage your wellness journey, book appointments, and track your progress.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card hover>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Upcoming Appointments
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">3</div>
                  <p className="text-sm text-foreground-muted">Next: Tomorrow at 2:00 PM</p>
                </CardContent>
              </Card>

              <Card hover>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-card-foreground">Total Services</h3>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">12</div>
                  <p className="text-sm text-foreground-muted">This month</p>
                </CardContent>
              </Card>

              <Card hover>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-card-foreground">Reviews</h3>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">4.8</div>
                  <p className="text-sm text-foreground-muted">Average rating</p>
                </CardContent>
              </Card>

              <Card hover>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-card-foreground">Points</h3>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">1,250</div>
                  <p className="text-sm text-foreground-muted">Loyalty points</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold text-card-foreground">Quick Actions</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button variant="primary" size="lg" className="w-full">
                      Book New Appointment
                    </Button>
                    <Button variant="secondary" size="lg" className="w-full">
                      View My Services
                    </Button>
                    <Button variant="accent" size="lg" className="w-full">
                      Write a Review
                    </Button>
                    <Button variant="ghost" size="lg" className="w-full">
                      Update Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold text-card-foreground">Recent Activity</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Massage Therapy</p>
                        <p className="text-sm text-foreground-muted">Completed yesterday</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-success">$80</p>
                        <p className="text-sm text-foreground-muted">Paid</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Facial Treatment</p>
                        <p className="text-sm text-foreground-muted">Scheduled for tomorrow</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-warning">$120</p>
                        <p className="text-sm text-foreground-muted">Pending</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Hair Styling</p>
                        <p className="text-sm text-foreground-muted">Completed last week</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-success">$65</p>
                        <p className="text-sm text-foreground-muted">Paid</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Profile Summary */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-card-foreground">Profile Summary</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-foreground-muted">Name:</span> {user?.firstName}{" "}
                        {user?.lastName}
                      </p>
                      <p>
                        <span className="text-foreground-muted">Email:</span> {user?.email}
                      </p>
                      <p>
                        <span className="text-foreground-muted">Role:</span>{" "}
                        {user?.isSuperuser ? "Superuser" : user?.isStaff ? "Staff" : "Client"}
                      </p>
                      <p>
                        <span className="text-foreground-muted">Member since:</span>{" "}
                        {user?.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Account Status</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-foreground-muted">Status:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            user?.isActive
                              ? "bg-success-light text-success"
                              : "bg-error-light text-error"
                          }`}>
                          {user?.isActive ? "Active" : "Inactive"}
                        </span>
                      </p>
                      <p>
                        <span className="text-foreground-muted">Last login:</span>{" "}
                        {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "N/A"}
                      </p>
                      <p>
                        <span className="text-foreground-muted">Staff access:</span>{" "}
                        {user?.isStaff ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
