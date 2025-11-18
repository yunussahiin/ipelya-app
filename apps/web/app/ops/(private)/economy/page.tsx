import {
  IconChartBar,
  IconClock,
  IconCoin,
  IconCreditCard,
  IconDownload,
  IconTrendingUp
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { RevenueChart } from "./revenue-chart";

export default async function EconomyPage() {
  const supabase = await createServerSupabaseClient();

  // İstatistikler
  const { count: totalTransactions } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true });

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ekonomi</h1>
          <p className="text-muted-foreground">Finansal işlemler ve istatistikler</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <IconDownload className="mr-2 h-4 w-4" />
            Rapor İndir
          </Button>
          <Button>
            <IconChartBar className="mr-2 h-4 w-4" />
            Analiz
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺124,580</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+12.5%</span> geçen aya göre
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Ödemeler</CardTitle>
            <IconClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺8,450</div>
            <p className="text-xs text-muted-foreground">15 işlem bekliyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coin Satışı</CardTitle>
            <IconCoin className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,230</div>
            <p className="text-xs text-muted-foreground">Toplam coin satıldı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İşlem Sayısı</CardTitle>
            <IconCreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">Bu ay</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">İşlemler</TabsTrigger>
          <TabsTrigger value="payouts">Ödemeler</TabsTrigger>
          <TabsTrigger value="coins">Coin Satışları</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonelikler</TabsTrigger>
        </TabsList>

        {/* Transactions */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tüm İşlemler</CardTitle>
              <CardDescription>Finansal işlem geçmişi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4">
                <Input placeholder="İşlem ara..." className="max-w-sm" />
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="pending">Bekliyor</SelectItem>
                    <SelectItem value="failed">Başarısız</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="coin">Coin</SelectItem>
                    <SelectItem value="subscription">Abonelik</SelectItem>
                    <SelectItem value="ppv">PPV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İşlem ID</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TransactionsTable />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts */}
        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Creator Ödemeleri</CardTitle>
              <CardDescription>Creator'lara yapılan ödemeler</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Komisyon</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <PayoutsTable />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coins */}
        <TabsContent value="coins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coin Satışları</CardTitle>
              <CardDescription>Kullanıcıların coin alımları</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>Coin</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Ödeme</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <CoinSalesTable />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Abonelik İşlemleri</CardTitle>
              <CardDescription>Creator abonelikleri</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Başlangıç</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SubscriptionsTable />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function TransactionsTable() {
  const transactions = [
    {
      id: "TRX001",
      user: "user123",
      type: "coin",
      amount: "₺50",
      status: "completed",
      date: "2025-01-15 14:30"
    },
    {
      id: "TRX002",
      user: "creator456",
      type: "subscription",
      amount: "₺99",
      status: "completed",
      date: "2025-01-15 13:15"
    },
    {
      id: "TRX003",
      user: "user789",
      type: "ppv",
      amount: "₺25",
      status: "pending",
      date: "2025-01-15 12:00"
    }
  ];

  return (
    <>
      {transactions.map((tx) => (
        <TableRow key={tx.id}>
          <TableCell className="font-mono text-sm">{tx.id}</TableCell>
          <TableCell>@{tx.user}</TableCell>
          <TableCell>
            <Badge variant="outline">{tx.type}</Badge>
          </TableCell>
          <TableCell className="font-medium">{tx.amount}</TableCell>
          <TableCell>
            {tx.status === "completed" ? (
              <Badge variant="default" className="bg-green-500">
                Tamamlandı
              </Badge>
            ) : (
              <Badge variant="secondary">Bekliyor</Badge>
            )}
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{tx.date}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

function PayoutsTable() {
  const payouts = [
    {
      id: "1",
      creator: "creator123",
      amount: "₺1,500",
      commission: "₺300",
      net: "₺1,200",
      status: "paid",
      date: "2025-01-10"
    }
  ];

  return (
    <>
      {payouts.map((payout) => (
        <TableRow key={payout.id}>
          <TableCell>@{payout.creator}</TableCell>
          <TableCell>{payout.amount}</TableCell>
          <TableCell className="text-red-500">{payout.commission}</TableCell>
          <TableCell className="font-medium">{payout.net}</TableCell>
          <TableCell>
            <Badge variant="default" className="bg-green-500">
              Ödendi
            </Badge>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{payout.date}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

function CoinSalesTable() {
  const sales = [
    {
      id: "1",
      user: "user123",
      package: "100 Coin",
      coins: "100",
      amount: "₺50",
      payment: "Kredi Kartı",
      date: "2025-01-15"
    }
  ];

  return (
    <>
      {sales.map((sale) => (
        <TableRow key={sale.id}>
          <TableCell>@{sale.user}</TableCell>
          <TableCell>{sale.package}</TableCell>
          <TableCell className="font-medium">{sale.coins}</TableCell>
          <TableCell>{sale.amount}</TableCell>
          <TableCell>
            <Badge variant="outline">{sale.payment}</Badge>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{sale.date}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

function SubscriptionsTable() {
  const subs = [
    {
      id: "1",
      user: "user123",
      creator: "creator456",
      plan: "Aylık",
      amount: "₺99",
      status: "active",
      startDate: "2025-01-01"
    }
  ];

  return (
    <>
      {subs.map((sub) => (
        <TableRow key={sub.id}>
          <TableCell>@{sub.user}</TableCell>
          <TableCell>@{sub.creator}</TableCell>
          <TableCell>
            <Badge variant="outline">{sub.plan}</Badge>
          </TableCell>
          <TableCell className="font-medium">{sub.amount}</TableCell>
          <TableCell>
            <Badge variant="default" className="bg-green-500">
              Aktif
            </Badge>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{sub.startDate}</TableCell>
        </TableRow>
      ))}
    </>
  );
}
