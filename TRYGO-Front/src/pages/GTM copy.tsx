import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Filter,
  Plus,
  MoreHorizontal,
  TrendingUp,
  Target,
  Zap,
  Users,
  MessageSquare,
  Globe,
  Mail,
  DollarSign,
  Handshake,
  Star,
  ExternalLink,
  Rocket,
} from "lucide-react";

// Типы каналов
const channelTypes = {
  organic: { label: "Органический", color: "bg-green-100 text-green-800" },
  paid: { label: "Платный", color: "bg-red-100 text-red-800" },
  partner: { label: "Партнёрский", color: "bg-purple-100 text-purple-800" },
  community: { label: "Коммьюнити", color: "bg-blue-100 text-blue-800" },
  listing: { label: "Листинг", color: "bg-orange-100 text-orange-800" },
  pr: { label: "PR", color: "bg-pink-100 text-pink-800" },
};

// Статусы каналов
const channelStatuses = {
  planned: {
    label: "В планах",
    icon: "🟡",
    color: "bg-yellow-100 text-yellow-800",
  },
  active: { label: "Активен", icon: "🔵", color: "bg-blue-100 text-blue-800" },
  completed: {
    label: "Завершено",
    icon: "✅",
    color: "bg-green-100 text-green-800",
  },
};

// Этапы запуска
const launchStages = {
  demand: "Проверка спроса",
  warming: "Сбор базы и прогрев",
  scaling: "Масштабирование",
};

// Данные каналов
const channelsData = [
  {
    id: 1,
    stage: "warming",
    name: "Email-воронки",
    type: "organic",
    description: "Welcome-цепочка писем с оффером и обучающим контентом",
    kpis: "Open rate 25%, CTR 3.5%, Conversion 8%",
    status: "planned",
  },
  {
    id: 2,
    stage: "scaling",
    name: "Product Hunt",
    type: "listing",
    description: "Платформа для громкого запуска продукта",
    kpis: "Рефералы 500+, Регистрации 200+",
    status: "active",
  },
  {
    id: 3,
    stage: "demand",
    name: "LinkedIn Outreach",
    type: "organic",
    description: "Холодные сообщения целевой аудитории",
    kpis: "Response rate 15%, Встречи 20+",
    status: "completed",
  },
  {
    id: 4,
    stage: "demand",
    name: "Google Ads",
    type: "paid",
    description: "Поисковые объявления по ключевым словам",
    kpis: "CPC $2.5, CTR 4%, CPA $45",
    status: "active",
  },
  {
    id: 5,
    stage: "warming",
    name: "Telegram сообщества",
    type: "community",
    description: "Активность в тематических чатах и каналах",
    kpis: "Охват 5K, Переходы 150, Конверсия 12%",
    status: "active",
  },
  {
    id: 6,
    stage: "scaling",
    name: "Партнёрская программа",
    type: "partner",
    description: "Реферальная система для привлечения партнёров",
    kpis: "Партнёры 50+, Продажи 300+",
    status: "planned",
  },
  {
    id: 7,
    stage: "scaling",
    name: "Facebook Ads",
    type: "paid",
    description: "Таргетированная реклама в социальных сетях",
    kpis: "CPM $8, CTR 2.1%, ROAS 3.2x",
    status: "planned",
  },
  {
    id: 8,
    stage: "demand",
    name: "Content Marketing",
    type: "organic",
    description: "Блог-посты и гайды для SEO трафика",
    kpis: "Органический трафик 2K/мес, Lead rate 3%",
    status: "active",
  },
];

const GTM = () => {
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Фильтрация данных
  const filteredChannels = channelsData.filter((channel) => {
    const stageMatch =
      selectedStage === "all" || channel.stage === selectedStage;
    const statusMatch =
      selectedStatus === "all" || channel.status === selectedStatus;
    return stageMatch && statusMatch;
  });

  // Группировка по этапам
  const groupedChannels = filteredChannels.reduce((acc, channel) => {
    if (!acc[channel.stage]) {
      acc[channel.stage] = [];
    }
    acc[channel.stage].push(channel);
    return acc;
  }, {} as Record<string, typeof channelsData>);

  return (
    <>
      <div className="min-h-screen bg-research-gradient bg-grid-pattern flex flex-col ">
        <div className="flex-1 px-4 py-8 pt-24 max-w-[2000px] mx-auto w-full">
          {/* Заголовок */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">GTM-каналы</h1>
                <p className="text-gray-600 mt-1">
                  Управление каналами по этапам запуска продукта
                </p>
              </div>
            </div>
          </div>

          {/* Фильтры и статистика */}
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Статистика */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Всего каналов</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {channelsData.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Активных</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {channelsData.filter((c) => c.status === "active").length}
                </p>
              </CardContent>
            </Card>

            {/* Фильтры */}
            <Card>
              <CardContent className="p-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Этап
                </label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все этапы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все этапы</SelectItem>
                    <SelectItem value="demand">Проверка спроса</SelectItem>
                    <SelectItem value="warming">Прогрев</SelectItem>
                    <SelectItem value="scaling">Масштабирование</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Статус
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="planned">В планах</SelectItem>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="completed">Завершено</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Таблица каналов */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  Каналы запуска
                </CardTitle>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить канал
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Этап</TableHead>
                    <TableHead className="w-[200px]">Название канала</TableHead>
                    <TableHead className="w-[120px]">Тип канала</TableHead>
                    <TableHead>Краткое описание</TableHead>
                    <TableHead className="w-[200px]">KPI / Метрики</TableHead>
                    <TableHead className="w-[120px]">Статус</TableHead>
                    <TableHead className="w-[100px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedChannels).map(([stage, channels]) =>
                    channels.map((channel, index) => (
                      <TableRow key={channel.id} className="hover:bg-blue-50">
                        <TableCell>
                          {index === 0 && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {launchStages[stage as keyof typeof launchStages]}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {channel.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              channelTypes[
                                channel.type as keyof typeof channelTypes
                              ].color
                            }
                          >
                            {
                              channelTypes[
                                channel.type as keyof typeof channelTypes
                              ].label
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[300px]">
                          {channel.description}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="text-gray-700">{channel.kpis}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              channelStatuses[
                                channel.status as keyof typeof channelStatuses
                              ].color
                            }
                          >
                            {
                              channelStatuses[
                                channel.status as keyof typeof channelStatuses
                              ].icon
                            }{" "}
                            {
                              channelStatuses[
                                channel.status as keyof typeof channelStatuses
                              ].label
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {filteredChannels.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Нет каналов, соответствующих выбранным фильтрам
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default GTM;
