"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSendNotification } from "@/hooks/useSendNotification";
import { AlertCircle, CheckCircle, Loader2, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface UserProfile {
  id: string;
  user_id?: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  gender?: string;
  is_creator: boolean;
  role?: string;
  device_token?: string;
  last_device_info?: Record<string, unknown>;
  last_login_at?: string;
}

export default function SingleNotification() {
  const [recipientId, setRecipientId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [data, setData] = useState("{}");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "users" | "creators">("all");
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loadingFiltered, setLoadingFiltered] = useState(false);

  const { loading, error, success, sendNotification, reset } = useSendNotification();

  // Fetch filtered users for modal
  useEffect(() => {
    if (!showModal) return;

    const fetchFilteredUsers = async () => {
      try {
        setLoadingFiltered(true);
        const supabase = createBrowserSupabaseClient();
        let query = supabase
          .from("profiles")
          .select("id, user_id, username, display_name, avatar_url, gender, is_creator, role")
          .neq("role", "admin"); // Admin'leri hariç tut

        if (filterType === "creators") {
          query = query.eq("role", "creator");
        } else if (filterType === "users") {
          query = query.eq("role", "user");
        }
        // "all" için sadece admin olmayan kullanıcılar gelir

        const { data, error } = await query.limit(50);

        if (error) {
          console.error("Filter error:", error);
          setFilteredUsers([]);
        } else {
          setFilteredUsers(data || []);
        }
      } catch (err) {
        console.error("Error fetching filtered users:", err);
        setFilteredUsers([]);
      } finally {
        setLoadingFiltered(false);
      }
    };

    fetchFilteredUsers();
  }, [showModal, filterType]);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      try {
        setLoadingUsers(true);
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("id, user_id, username, display_name, avatar_url, gender, is_creator, role")
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) {
          console.error("Search error:", error);
          setUsers([]);
        } else {
          setUsers(data || []);
        }
      } catch (err) {
        console.error("Error searching users:", err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch user profile when recipientId changes
  useEffect(() => {
    if (!recipientId) {
      setUserProfile(null);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoadingUser(true);
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, user_id, username, display_name, avatar_url, gender, is_creator, role, device_token, last_device_info, last_login_at"
          )
          .eq("id", recipientId)
          .single();

        if (error) {
          console.error("User not found:", error);
          setUserProfile(null);
        } else {
          setUserProfile(data);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setUserProfile(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, [recipientId]);

  const handleSend = async () => {
    try {
      const parsedData = JSON.parse(data);
      // Use user_id from userProfile instead of profile id
      const recipientUserId = userProfile?.user_id || recipientId;
      await sendNotification({
        type: "single",
        title,
        body,
        data: parsedData,
        recipient_id: recipientUserId
      });
    } catch {
      alert("Invalid JSON in data field");
    }
  };

  const handleReset = () => {
    setRecipientId("");
    setTitle("");
    setBody("");
    setData("{}");
    reset();
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tekil Bildirim Gönder</CardTitle>
          <CardDescription>Belirli bir kullanıcıya bildirim gönderin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Alıcı Seç</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModal(true)}
                disabled={loading}
              >
                Kullanıcı Seç
              </Button>
            </div>
            <div className="relative">
              <Input
                placeholder="Kullanıcı adı veya adını yazın..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                disabled={loading}
              />

              {showDropdown && (searchQuery || users.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="p-3 text-center text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Aranıyor...
                    </div>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setRecipientId(user.id);
                          setUserProfile(user);
                          setShowDropdown(false);
                          setSearchQuery("");
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.display_name || user.username}
                            </p>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {user.is_creator && (
                              <span
                                className="inline-block w-2 h-2 bg-purple-500 rounded-full"
                                title="Creator"
                              ></span>
                            )}
                            {user.gender === "M" && <span className="text-xs">👨</span>}
                            {user.gender === "F" && <span className="text-xs">👩</span>}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : searchQuery ? (
                    <div className="p-3 text-center text-sm text-gray-500">
                      Kullanıcı bulunamadı
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {recipientId && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <p className="text-blue-900">
                  ✓ Seçili:{" "}
                  <span className="font-medium">
                    {userProfile?.display_name || userProfile?.username}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Başlık</label>
            <Input
              placeholder="Bildirim başlığı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">İçerik</label>
            <Textarea
              placeholder="Bildirim içeriği"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ek Veri (JSON)</label>
            <Textarea
              placeholder='{"key": "value"}'
              value={data}
              onChange={(e) => setData(e.target.value)}
              disabled={loading}
              rows={3}
              className="font-mono text-xs"
            />
          </div>

          {error && (
            <div className="flex gap-2 p-3 rounded-md bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex gap-2 p-3 rounded-md bg-green-50 border border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">Bildirim başarıyla gönderildi!</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSend}
              disabled={loading || !recipientId || !title || !body}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gönder
            </Button>
            <Button onClick={handleReset} variant="outline" disabled={loading}>
              Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Önizleme & Alıcı Bilgisi</CardTitle>
          <CardDescription>Bildirim ve alıcı detayları</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Profile Card */}
          {recipientId && (
            <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 space-y-4">
              {loadingUser ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : userProfile ? (
                <>
                  {/* Header with Avatar */}
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden border-2 border-blue-300 shadow-md">
                      {userProfile.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt={userProfile.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-2xl">
                          {userProfile.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 pt-1">
                      <p className="text-base font-bold text-gray-900">
                        {userProfile.display_name || userProfile.username}
                      </p>
                      <p className="text-sm text-gray-600">@{userProfile.username}</p>
                    </div>
                  </div>

                  {/* Rol ve Cinsiyet */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-500 font-semibold mb-2">Rol</p>
                      <div className="flex items-center gap-2">
                        {userProfile.role === "admin" && (
                          <>
                            <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                            <span className="text-sm font-bold text-red-700">🔐 Admin</span>
                          </>
                        )}
                        {userProfile.role === "creator" && (
                          <>
                            <span className="inline-block w-3 h-3 bg-purple-500 rounded-full"></span>
                            <span className="text-sm font-bold text-purple-700">⭐ Creator</span>
                          </>
                        )}
                        {userProfile.role === "user" && (
                          <>
                            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
                            <span className="text-sm font-bold text-blue-700">👤 User</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-500 font-semibold mb-2">Cinsiyet</p>
                      <p className="text-sm font-bold text-gray-900">
                        {userProfile.gender === "M"
                          ? "👨 Erkek"
                          : userProfile.gender === "F"
                            ? "👩 Kadın"
                            : "❓ Belirtilmedi"}
                      </p>
                    </div>
                  </div>

                  {/* Cihaz ve Bildirim Bilgisi */}
                  <div className="space-y-3 pt-3 border-t border-blue-200">
                    {/* Cihaz Bilgisi */}
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-600 font-semibold mb-2">📱 Cihaz Bilgisi</p>
                      {userProfile.last_device_info ? (
                        <div className="text-xs text-gray-700 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">📍</span>
                            <span>Platform:</span>
                            <span className="font-mono font-semibold text-gray-900">
                              {typeof userProfile.last_device_info === "object"
                                ? ((userProfile.last_device_info as Record<string, unknown>)
                                    .platform as string) || "N/A"
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">🖥️</span>
                            <span>Model:</span>
                            <span className="font-mono font-semibold text-gray-900">
                              {typeof userProfile.last_device_info === "object"
                                ? ((userProfile.last_device_info as Record<string, unknown>)
                                    .model as string) || "N/A"
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">⚙️</span>
                            <span>OS:</span>
                            <span className="font-mono font-semibold text-gray-900">
                              {typeof userProfile.last_device_info === "object"
                                ? ((userProfile.last_device_info as Record<string, unknown>)
                                    .os_version as string) || "N/A"
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Cihaz bilgisi bulunamadı</p>
                      )}
                    </div>

                    {/* Bildirim Durumu ve Son Giriş */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-gray-600 font-semibold mb-2">🔔 Bildirim</p>
                        {userProfile.device_token ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                            <span className="text-sm font-bold text-green-700">✓ Aktif</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                            <span className="text-sm font-bold text-red-700">✗ Devre Dışı</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-gray-600 font-semibold mb-2">🕐 Son Giriş</p>
                        <p className="text-xs font-semibold text-gray-900">
                          {userProfile.last_login_at
                            ? new Date(userProfile.last_login_at).toLocaleDateString("tr-TR")
                            : "Hiç giriş yok"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-blue-200">
                    <p className="text-xs text-gray-600">User ID</p>
                    <p className="text-xs font-mono text-gray-700 break-all">{userProfile.id}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-700">❌ Kullanıcı bulunamadı</p>
              )}
            </div>
          )}

          {/* Notification Preview */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Başlık</p>
              <p className="text-lg font-semibold text-gray-900">
                {title || "Bildirim başlığı..."}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500">İçerik</p>
              <p className="text-sm text-gray-700">{body || "Bildirim içeriği..."}</p>
            </div>

            {data !== "{}" && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Ek Veri</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(JSON.parse(data || "{}"), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <Card
            className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <div>
                <CardTitle>Kullanıcı Seç</CardTitle>
                <CardDescription>Rol türüne göre filtrele</CardDescription>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4">
              {/* Filter Tabs */}
              <div className="flex gap-2 mb-4">
                {[
                  { value: "all", label: "Tüm Kullanıcılar" },
                  { value: "users", label: "Sadece Users" },
                  { value: "creators", label: "Sadece Creators" }
                ].map((tab) => (
                  <Button
                    key={tab.value}
                    variant={filterType === tab.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType(tab.value as "all" | "users" | "creators")}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>

              {/* Users List */}
              <div className="space-y-2">
                {loadingFiltered ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setRecipientId(user.id);
                        setUserProfile(user);
                        setShowModal(false);
                        setSearchQuery("");
                      }}
                      className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
                                {user.username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.display_name || user.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                          </div>
                        </div>

                        {/* Role & Gender Badges */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {user.role === "creator" && (
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded whitespace-nowrap">
                              ⭐ Creator
                            </span>
                          )}
                          {user.role === "user" && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded whitespace-nowrap">
                              👤 User
                            </span>
                          )}
                          {user.gender === "M" && <span className="text-sm">👨</span>}
                          {user.gender === "F" && <span className="text-sm">👩</span>}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Kullanıcı bulunamadı</p>
                  </div>
                )}
              </div>
            </CardContent>

            <div className="border-t p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Kapat
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
