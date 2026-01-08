import { renderFeed } from "./render.js";

async function loadFeed() {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError) return console.error(userError);

  // 1️⃣ Freunde holen
  const { data: friends } = await supabaseClient
    .from("friends")
    .select("friend_id")
    .eq("user_id", user.id);

  const userIds = [
    user.id,
    ...(friends?.map(f => f.friend_id) || [])
  ];

  // 2️⃣ Posts holen
  const { data: posts, error } = await supabaseClient
    .from("posts")
    .select(`
      id,
      user_id,
      type,
      content,
      image_paths,
      created_at
    `)
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  if (error) return console.error(error);

  // 3️⃣ Usernames zu user_ids holen
  const uniqueUserIds = [...new Set(posts.map(p => p.user_id))];

  const { data: profiles } = await supabaseClient
    .from("profiles")
    .select("id, username")
    .in("id", uniqueUserIds);

  // 4️⃣ Map bauen
  const profileMap = {};
  profiles.forEach(p => {
    profileMap[p.id] = p.username;
  });

  // 5️⃣ Username an Posts anhängen
  const enrichedPosts = posts.map(post => ({
    ...post,
    username: profileMap[post.user_id] || "Unknown"
  }));

  renderFeed(enrichedPosts);
}

loadFeed();