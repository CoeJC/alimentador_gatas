import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Utensils,
  History,
  Wifi,
  WifiOff,
} from "lucide-react";

import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function FeederDashboard() {

  const [autoRefresh, setAutoRefresh] = useState(true);

  const [history, setHistory] = useState<any[]>([]);

  /*
   * STATUS
   */

  const [status, setStatus] = useState({
    meal1Completed: 0,
    meal2Completed: 0,
    meal3Completed: 0,
    meal4Completed: 0,
    meal5Completed: 0,
    meal6Completed: 0,
    currentTime: "--:--",
    isOnline: 0,
    nextMealTime: "--:--",
    lastHeartbeat: null as any,
  });

  /*
   * HORÁRIOS
   */

  const schedules = [
    {
      mealNumber: 1,
      hour: 7,
      minute: 50,
    },
    {
      mealNumber: 2,
      hour: 10,
      minute: 0,
    },
    {
      mealNumber: 3,
      hour: 13,
      minute: 30,
    },
    {
      mealNumber: 4,
      hour: 18,
      minute: 10,
    },
    {
      mealNumber: 5,
      hour: 21,
      minute: 0,
    },
    {
      mealNumber: 6,
      hour: 23,
      minute: 0,
    },
  ];

  /*
   * HISTÓRICO
   */

  async function carregarHistorico() {

    try {

      const response = await fetch("/device/history");

      const json = await response.json();

      if (json.success) {

        setHistory(json.data);
      }

    } catch (err) {

      console.error(err);
    }
  }

  /*
   * STATUS
   */

  async function carregarStatus() {

    try {

      const response = await fetch("/device/status");

      const json = await response.json();

      console.log("STATUS:", json);

      if (json.success) {

        setStatus({
          meal1Completed: json.data.meal1Completed || 0,
          meal2Completed: json.data.meal2Completed || 0,
          meal3Completed: json.data.meal3Completed || 0,
          meal4Completed: json.data.meal4Completed || 0,
          meal5Completed: json.data.meal5Completed || 0,
          meal6Completed: json.data.meal6Completed || 0,
          currentTime: json.data.currentTime || "--:--",
          isOnline: json.data.isOnline || 0,
          nextMealTime: calcularProximaRefeicao(),
          lastHeartbeat: json.data.lastUpdate
            ? new Date(json.data.lastUpdate)
            : null,
        });
      }

    } catch (err) {

      console.error(err);
    }
  }

  /*
   * AUTO REFRESH
   */

  useEffect(() => {

    carregarHistorico();

    carregarStatus();

    if (!autoRefresh) return;

    const interval = setInterval(() => {

      carregarHistorico();

      carregarStatus();

    }, 5000);

    return () => clearInterval(interval);

  }, [autoRefresh]);

  /*
   * PRÓXIMA REFEIÇÃO
   */

  function calcularProximaRefeicao() {

    const agora = new Date();

    const horaAtual = agora.getHours();

    const minutoAtual = agora.getMinutes();

    for (const meal of schedules) {

      if (
        meal.hour > horaAtual ||
        (meal.hour === horaAtual && meal.minute > minutoAtual)
      ) {

        return `${String(meal.hour).padStart(2, "0")}:${String(
          meal.minute
        ).padStart(2, "0")}`;
      }
    }

    return "07:50";
  }

  /*
   * ALIMENTAÇÃO MANUAL
   */

  async function alimentarManual(mealNumber: number) {

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

      toast.success(`Refeição ${mealNumber} acionada! 🐱`);

      carregarHistorico();

      carregarStatus();

    } catch (error: any) {

      toast.error(`Erro: ${error.message}`);
    }
  }

  /*
   * HELPERS
   */

  const getMealStatusColor = (completed: number) => {

    return completed === 1
      ? "bg-emerald-100 text-emerald-800"
      : "bg-amber-100 text-amber-800";
  };

  const getMealStatusText = (completed: number) => {

    return completed === 1
      ? "✓ Alimentada"
      : "⏳ Pendente";
  };

  const getTypeLabel = (type: string) => {

    return type === "manual"
      ? "Manual"
      : "Automática";
  };

  const getTypeColor = (type: string) => {

    return type === "manual"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
  };

  /*
   * JSX
   */

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">

      {/* HEADER */}

      <div className="max-w-6xl mx-auto mb-8">

        <div className="flex items-center justify-between mb-6">

          <div>

            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-4xl">🐱</span>
              Alimentador Automático
            </h1>

            <p className="text-gray-600 mt-2">
              Controle e monitore as refeições das suas gatas
            </p>

          </div>

          <div className="flex items-center gap-2">

            {status?.isOnline === 1 ? (

              <Badge className="bg-emerald-500 text-white flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Online
              </Badge>

            ) : (

              <Badge
                variant="destructive"
                className="flex items-center gap-1"
              >
                <WifiOff className="w-3 h-3" />
                Offline
              </Badge>

            )}

          </div>

        </div>

        {/* STATUS */}

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">

          <CardHeader className="pb-3">

            <CardTitle className="text-lg">
              Status do Dispositivo
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div>

                <p className="text-sm text-gray-600 mb-1">
                  Horário Atual
                </p>

                <p className="text-2xl font-bold text-gray-900">
                  {status?.currentTime || "--:--"}
                </p>

              </div>

              <div>

                <p className="text-sm text-gray-600 mb-1">
                  Próxima Refeição
                </p>

                <p className="text-2xl font-bold text-purple-600">
                  {status?.nextMealTime || "--:--"}
                </p>

              </div>

              <div>

                <p className="text-sm text-gray-600 mb-1">
                  Última Sincronização
                </p>

                <p className="text-sm text-gray-700">
                  {status?.lastSync
                    ? formatDistanceToNow(new Date(status.lastSync), {
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

      {/* REFEIÇÕES */}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-4">

          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-purple-600" />
            Status das Refeições
          </h2>

          {schedules.map((meal) => {

            const completed =
              status[
                `meal${meal.mealNumber}Completed` as keyof typeof status
              ] as number;

            return (

              <Card
                key={meal.mealNumber}
                className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >

                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white pb-3">

                  <CardTitle className="text-xl">
                    Refeição {meal.mealNumber}
                  </CardTitle>

                  <CardDescription className="text-purple-100">

                    {String(meal.hour).padStart(2, "0")}:
                    {String(meal.minute).padStart(2, "0")}

                  </CardDescription>

                </CardHeader>

                <CardContent className="pt-6">

                  <div className="flex items-center justify-between mb-4">

                    <Badge
                      className={`text-base py-2 px-4 ${getMealStatusColor(
                        completed
                      )}`}
                    >
                      {getMealStatusText(completed)}
                    </Badge>

                    <Button
                      onClick={() =>
                        alimentarManual(meal.mealNumber)
                      }
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Alimentar Agora
                    </Button>

                  </div>

                </CardContent>

              </Card>
            );
          })}
        </div>

        {/* CONFIG */}

        <Card className="border-0 shadow-lg h-fit">

          <CardHeader>

            <CardTitle className="text-lg">
              Configurações
            </CardTitle>

          </CardHeader>

          <CardContent className="space-y-4">

            <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">

              <span className="text-sm font-medium text-gray-700">
                Auto-atualizar
              </span>

              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="w-16"
              >
                {autoRefresh ? "Ativo" : "Inativo"}
              </Button>

            </div>

          </CardContent>

        </Card>

      </div>

      {/* HISTÓRICO */}

      <div className="max-w-6xl mx-auto mt-8">

        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">

          <History className="w-6 h-6 text-purple-600" />

          Histórico de Alimentações

        </h2>

        <Card className="border-0 shadow-lg">

          <CardContent className="pt-6">

            {history.length === 0 ? (

              <div className="text-center py-8 text-gray-500">

                <p className="text-lg">
                  Nenhuma alimentação registrada ainda
                </p>

              </div>

            ) : (

              <div className="space-y-2">

                {[...history].reverse().map((item) => (

                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >

                    <div className="flex items-center gap-4">

                      <div className="text-2xl">
                        🍽️
                      </div>

                      <div>

                        <p className="font-medium text-gray-900">
                          Refeição {item.mealNumber}
                        </p>

                        <p className="text-sm text-gray-600">

                          {format(
                            new Date(item.timestamp),
                            "dd/MM/yyyy HH:mm:ss",
                            {
                              locale: ptBR,
                            }
                          )}

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

      {/* FOOTER */}

      <div className="max-w-6xl mx-auto mt-12 text-center text-sm text-gray-600">

        <p>🐱 Cuide bem das suas gatas! 🐱</p>

      </div>

    </div>
  );
}
