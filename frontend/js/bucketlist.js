// Eintrag laden
async function loadBucketItems() {
  const { data, error } = await supabaseClient
    .from("bucket_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return console.error(error);
  renderBucketList(data);
}

// Eintrag erstellen
async function addBucketItem(title) {
  const { data: { user } } = await supabaseClient.auth.getUser();

  // 1️⃣ Bucketlist-Item erstellen
  const { data: item, error } = await supabaseClient
    .from("bucket_items")
    .insert({
      user_id: user.id,
      title,
      completed: false
    })
    .select()
    .single();

  if (error) return console.error(error);

  // 2️⃣ Feed-Post erstellen
  await supabaseClient.from("posts").insert({
    user_id: user.id,
    type: "bucket_add",
    bucket_item_id: item.id,
    content: `🆕 Hat "${title}" zur Bucketlist hinzugefügt`
  });

  loadBucketItems();
}


async function renderBucketList(items) {
  const pendingEl = document.getElementById("pending-list");
  const doneEl = document.getElementById("done-list");
  if (!pendingEl || !doneEl) return;

  pendingEl.innerHTML = "";
  doneEl.innerHTML = "";

  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = `${item.title} ${item.completed ? "✅" : ""}`;

    if (!item.completed) {
      const btn = document.createElement("button");
      btn.textContent = "Abhaken";
      btn.onclick = () => location.href = `post.html?id=${item.id}`;
      li.appendChild(btn);
      pendingEl.appendChild(li);
    } else {
      // Post-ID auslesen
      const postId = item.post_id;
      if (!postId) {
        console.warn('No post_id for item:', item.id);
        doneEl.appendChild(li);
        continue;
      }

      // Post laden
      const { data: post, error } = await supabaseClient
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) {
        console.error('Error loading post:', error);
        doneEl.appendChild(li);
        continue;
      }

      // Post-Daten anzeigen (z.B. Content und Bilder)
      li.innerHTML = `<strong>${item.title}</strong><br>${post.content}`;
      if (post.image_paths && post.image_paths.length > 0) {
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
        li.appendChild(img);
        }
      }
      doneEl.appendChild(li);
    }
  }
}
