async function loadFeed() {
  const { data: posts } = await supabaseClient
  .from("posts")
  .select(`
    id,
    type,
    content,
    created_at,
    bucket_items ( title )
  `)
  .order("created_at", { ascending: false });

  renderFeed(posts);
}

async function getFriendIds(userId) {
  const { data } = await supabaseClient
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId);

  return data ? data.map(f => f.friend_id) : [];
}

async function renderFeed(posts) {
  const feed = document.getElementById("feed");
  if (!feed) return;

  feed.innerHTML = "";

  for (const post of posts) {
    const card = document.createElement("div");
    card.className = "post";

    /* =====================
       POST-TYP
    ===================== */

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
      /* =====================
         NORMALER POST
      ===================== */

      // Text
      if (post.content) {
        const p = document.createElement("p");
        p.textContent = post.content;
        card.appendChild(p);
      }

      // Bilder
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
    }

    feed.appendChild(card);
  }
}

loadFeed();