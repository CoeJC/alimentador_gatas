import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Utensils, History, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function FeederDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Queries
  const statusQuery = trpc.feeder.getStatus.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const historyQuery = trpc.feeder.getHistory.useQuery({ limit: 15 }, {
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Mutations
  const feedManuallyMutation = {
  mutate: async ({ mealNumber }: { mealNumber: number }) => {
    try {
      const response = await fetch("/device/feed-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar comando");
      }

      toast.success("Alimentação manual acionada! 🐱");

      statusQuery.refetch();
      historyQuery.refetch();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  },
  isPending: false,
};

  const status = {
  meal1Completed: statusQuery.data?.device?.meal1Completed || 0,
  meal2Completed: statusQuery.data?.device?.meal2Completed || 0,
  currentTime: statusQuery.data?.device?.currentTime || "--:--",
  isOnline: 1,
  nextMealTime: "08:00",
  lastHeartbeat: new Date().toISOString(),
};
  const schedules = [
  {
    mealNumber: 1,
    hour: 8,
    minute: 0,
  },
  {
    mealNumber: 2,
    hour: 18,
    minute: 0,
  },
];
  const history = historyQuery.data || [];

  const meal1Schedule = schedules.find((s) => s.mealNumber === 1);
  const meal2Schedule = schedules.find((s) => s.mealNumber === 2);

  const getMealStatusColor = (completed: number) => {
    return completed === 1 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
  };

  const getMealStatusText = (completed: number) => {
    return completed === 1 ? "✓ Alimentada" : "⏳ Pendente";
  };

  const getTypeLabel = (type: string) => {
    return type === "manual" ? "Manual" : "Automática";
  };

  const getTypeColor = (type: string) => {
    return type === "manual"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-4xl">🐱</span>
              Alimentador Automático
            </h1>
            <p className="text-gray-600 mt-2">Controle e monitore as refeições das suas gatas</p>
          </div>
          <div className="flex items-center gap-2">
            {status?.isOnline === 1 ? (
              <Badge className="bg-emerald-500 text-white flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                Offline
              </Badge>
            )}
          </div>
        </div>

        {/* Device Status */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Status do Dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Horário Atual</p>
                <p className="text-2xl font-bold text-gray-900">
                  {status?.currentTime || "--:--"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Próxima Refeição</p>
                <p className="text-2xl font-bold text-purple-600">
                  {status?.nextMealTime || "--:--"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Última Sincronização</p>
                <p className="text-sm text-gray-700">
                  {status?.lastHeartbeat
                    ? formatDistanceToNow(new Date(status.lastHeartbeat), {
                        locale: ptBR,
                        addSuffix: true,
                      })
                    : "Nunca"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meal Status Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-purple-600" />
            Status das Refeições
          </h2>

          {/* Meal 1 */}
          <Card className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white pb-3">
              <CardTitle className="text-xl">Refeição 1</CardTitle>
              <CardDescription className="text-purple-100">
                {meal1Schedule ? `${meal1Schedule.hour}:${String(meal1Schedule.minute).padStart(2, "0")}` : "Não configurado"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Badge className={`text-base py-2 px-4 ${getMealStatusColor(status?.meal1Completed || 0)}`}>
                  {getMealStatusText(status?.meal1Completed || 0)}
                </Badge>
                <Button
                  onClick={() => feedManuallyMutation.mutate({ mealNumber: 1 })}
                  disabled={feedManuallyMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {feedManuallyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Alimentando...
                    </>
                  ) : (
                    "Alimentar Agora"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Meal 2 */}
          <Card className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white pb-3">
              <CardTitle className="text-xl">Refeição 2</CardTitle>
              <CardDescription className="text-blue-100">
                {meal2Schedule ? `${meal2Schedule.hour}:${String(meal2Schedule.minute).padStart(2, "0")}` : "Não configurado"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Badge className={`text-base py-2 px-4 ${getMealStatusColor(status?.meal2Completed || 0)}`}>
                  {getMealStatusText(status?.meal2Completed || 0)}
                </Badge>
                <Button
                  onClick={() => feedManuallyMutation.mutate({ mealNumber: 2 })}
                  disabled={feedManuallyMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {feedManuallyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Alimentando...
                    </>
                  ) : (
                    "Alimentar Agora"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auto-refresh Toggle */}
        <Card className="border-0 shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Auto-atualizar</span>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="w-16"
              >
                {autoRefresh ? "Ativo" : "Inativo"}
              </Button>
            </div>
            {statusQuery.isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </div>
            )}
            {statusQuery.isError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Erro ao carregar status</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Section */}
      <div className="max-w-6xl mx-auto mt-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <History className="w-6 h-6 text-purple-600" />
          Histórico de Alimentações
        </h2>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            {historyQuery.isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : history && history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">Nenhuma alimentação registrada ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history && [...history].reverse().map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {item.mealNumber === 1 ? "🍽️" : "🥘"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Refeição {item.mealNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(item.timestamp), "dd/MM/yyyy HH:mm:ss", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge className={getTypeColor(item.type)}>
                      {getTypeLabel(item.type)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-12 text-center text-sm text-gray-600">
        <p>🐱 Cuide bem das suas gatas! 🐱</p>
      </div>
    </div>
  );
}
