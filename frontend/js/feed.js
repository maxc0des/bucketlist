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


async function renderFeed(posts) {
  const feed = document.getElementById("feed");
  if (!feed) return;

  feed.innerHTML = "";

  for (const post of posts) {
    const card = document.createElement("div");
    card.className = "post";
    
    const header = document.createElement("div");
    header.className = "post-header";
    header.textContent = post.username;
    card.appendChild(header);

    if (post.type === "bucket_add") {
      const p = document.createElement("p");
      p.textContent = post.content || "🆕 Bucketlist-Item hinzugefügt";
      card.appendChild(p);
    }

    else if (post.type === "bucket_done") {
      const p = document.createElement("p");
      p.textContent = post.content || "✅ Bucketlist-Item erledigt";
      card.appendChild(p);
    }

    else {
      // normaler Post
      if (post.image_paths?.length > 0) {
        for (const path of post.image_paths) {
          const { data, error } = await supabaseClient
            .storage
            .from("post-images")
            .createSignedUrl(path, 60 * 10);

          if (error) {
            console.error(error);
            continue;
          }

          const img = document.createElement("img");
          img.src = data.signedUrl;
          img.style.maxWidth = "200px";
          card.appendChild(img);
        }
      }

      if (post.content) {
        const p = document.createElement("p");
        p.textContent = post.content;
        card.appendChild(p);
      }
    }

    feed.appendChild(card);

    // Add separator line after each card
    const separator = document.createElement("hr");
    separator.style.border = "none";
    separator.style.borderTop = "1px solid #ddd";
    separator.style.margin = "10px 0";
    feed.appendChild(separator);
  }
}

loadFeed();