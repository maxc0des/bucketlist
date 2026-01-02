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
      pendingEl.appendChild(li);

      // Add separator
      const separator = document.createElement("hr");
      separator.style.border = "none";
      separator.style.borderTop = "1px solid #ddd";
      separator.style.margin = "10px 0";
      pendingEl.appendChild(separator);
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
      li.innerHTML = `<strong>${item.title}</strong>`;
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
      const contentP = document.createElement("p");
      contentP.textContent = post.content;
      li.appendChild(contentP);
      doneEl.appendChild(li);

      // Add separator
      const separator = document.createElement("hr");
      separator.style.border = "none";
      separator.style.borderTop = "1px solid #ddd";
      separator.style.margin = "10px 0";
      doneEl.appendChild(separator);
    }
  }
}

async function loadUserItems() {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("id");
    const { data, error } = await supabaseClient
        .from("bucket_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) return console.error(error);
    renderBucketList(data);
}


async function loadProfile() {
  const params = new URLSearchParams(window.location.search);
  const profileId = params.get("id");
  if (!profileId) return;

  // Profil
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("id, username, bio")
    .eq("id", profileId)
    .single();

  if (profileError) {
    console.error(profileError);
    alert("Profil nicht verfügbar");
    return;
  }

  document.getElementById("username").textContent = profile.username;
  document.getElementById("bio").textContent = profile.bio ?? "";
}

loadProfile();
