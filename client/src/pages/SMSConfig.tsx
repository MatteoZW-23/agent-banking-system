import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import {
  Phone,
  MessageSquare,
  Settings,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export function SMSConfigContent() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [minSeverity, setMinSeverity] = useState<
    "low" | "medium" | "high" | "critical"
  >("high");
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([
    "discrepancy",
    "low_float",
    "failed_reconciliation",
  ]);
  const [testPhone, setTestPhone] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  const alertTypes = [
    {
      id: "discrepancy",
      label: "Large Discrepancies",
      description: "Alert when discrepancies exceed threshold",
    },
    {
      id: "low_float",
      label: "Low Float Balance",
      description: "Alert when float falls below minimum",
    },
    {
      id: "failed_reconciliation",
      label: "Failed Reconciliation",
      description: "Alert when reconciliation fails",
    },
    {
      id: "suspicious_transaction",
      label: "Suspicious Transactions",
      description: "Alert on flagged transactions",
    },
    {
      id: "high_commission",
      label: "High Commission",
      description: "Alert on unusual commission amounts",
    },
  ];

  const handleAddPhone = () => {
    if (newPhone.trim()) {
      setPhoneNumbers([...phoneNumbers, newPhone.trim()]);
      setNewPhone("");
      toast.success("Phone number added");
    }
  };

  const handleRemovePhone = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
    toast.success("Phone number removed");
  };

  const handleToggleAlert = (alertId: string) => {
    setSelectedAlerts(prev =>
      prev.includes(alertId)
        ? prev.filter(a => a !== alertId)
        : [...prev, alertId]
    );
  };

  const handleSaveConfig = () => {
    if (!isEnabled && phoneNumbers.length === 0) {
      toast.error("SMS alerts are disabled. Enable them to configure.");
      return;
    }

    if (isEnabled && phoneNumbers.length === 0) {
      toast.error("Please add at least one phone number");
      return;
    }

    // Save configuration
    console.log("Saving SMS configuration:", {
      isEnabled,
      phoneNumbers,
      minSeverity,
      selectedAlerts,
    });

    toast.success("SMS configuration saved successfully");
  };

  const handleTestSMS = async () => {
    if (!testPhone.trim()) {
      toast.error("Please enter a test phone number");
      return;
    }

    setIsTesting(true);
    try {
      // Simulate SMS test
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Test SMS sent to ${testPhone}`);
    } catch (error) {
      toast.error("Failed to send test SMS");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SMS Configuration</h1>
        <p className="text-muted-foreground">
          Configure Africa's Talking SMS gateway for alert notifications
        </p>
      </div>

      {/* Enable/Disable SMS */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Alerts Status</CardTitle>
          <CardDescription>
            Enable or disable SMS notifications for system alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isEnabled ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <p className="font-semibold">
                  {isEnabled ? "SMS Alerts Enabled" : "SMS Alerts Disabled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isEnabled
                    ? "System will send SMS notifications for configured alerts"
                    : "No SMS notifications will be sent"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isEnabled
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {isEnabled ? "Disable" : "Enable"}
            </button>
          </div>
        </CardContent>
      </Card>

      {isEnabled && (
        <>
          {/* Recipient Phone Numbers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Recipient Phone Numbers</span>
              </CardTitle>
              <CardDescription>
                Add phone numbers that will receive SMS alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+263 71 234 5678 or 0712345678"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button onClick={handleAddPhone}>Add</Button>
              </div>

              <div className="space-y-2">
                {phoneNumbers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No phone numbers added yet
                  </p>
                ) : (
                  phoneNumbers.map((phone, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <span className="font-mono">{phone}</span>
                      <button
                        onClick={() => handleRemovePhone(idx)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alert Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Alert Types</span>
              </CardTitle>
              <CardDescription>
                Select which alert types should trigger SMS notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertTypes.map(alert => (
                <label
                  key={alert.id}
                  className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedAlerts.includes(alert.id)}
                    onChange={() => handleToggleAlert(alert.id)}
                    className="w-4 h-4 mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{alert.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.description}
                    </p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Minimum Severity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Minimum Alert Severity</span>
              </CardTitle>
              <CardDescription>
                Only send SMS for alerts with this severity level or higher
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {(["low", "medium", "high", "critical"] as const).map(
                  severity => (
                    <button
                      key={severity}
                      onClick={() => setMinSeverity(severity)}
                      className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                        minSeverity === severity
                          ? "bg-blue-600 text-white"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {severity}
                    </button>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test SMS */}
          <Card>
            <CardHeader>
              <CardTitle>Test SMS Service</CardTitle>
              <CardDescription>
                Send a test SMS to verify your configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="Enter test phone number"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button onClick={handleTestSMS} disabled={isTesting}>
                  {isTesting ? "Sending..." : "Send Test SMS"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Configuration */}
          <div className="flex justify-end">
            <Button size="lg" onClick={handleSaveConfig}>
              <Settings className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </>
      )}

      {!isEnabled && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">
                  SMS Alerts Disabled
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  Enable SMS alerts above to configure phone numbers and alert
                  types for real-time notifications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SMSConfig() {
  return (
    <DashboardLayout>
      <SMSConfigContent />
    </DashboardLayout>
  );
}
