async function loadProfile() {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError) return console.error(userError);

  let { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id);

  if (error) return console.error(error);

  // Profil erstellen, falls nicht vorhanden
  if (data.length === 0) {
    await supabaseClient.from("profiles").insert({
      id: user.id,
      username: "",
      bio: ""
    });
    // Daten erneut laden
    const res = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    data = [res.data];
  }

  document.getElementById("username").value = data[0].username;
  document.getElementById("bio").value = data[0].bio;
}

async function saveProfile() {
  const errorEl = document.getElementById("error-message");
  errorEl.textContent = "";
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError) return console.error(userError);

  const new_username = document.getElementById("username").value.trim();
  const new_bio = document.getElementById("bio").value;

  // Überprüfe, ob der Username leer ist
  if (!new_username) {
    errorEl.textContent = "Username darf nicht leer sein.";
    return;
  }

  // Hole das aktuelle Profil
  const { data: currentProfile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profileError) {
    //profil neu erstellen falls nicht vorhanden
      await supabaseClient.from("profiles").insert({
        id: user.id,
        username: new_username,
        bio: new_bio
      });
  }

  const current_username = currentProfile.username;

  // Wenn der Username sich nicht geändert hat, speichere direkt
  if (new_username === current_username) {
    const { data, error } = await supabaseClient
      .from("profiles")
      .update({
        bio: new_bio
      })
      .eq("id", user.id);

    if (error) return console.error(error);
    console.log("Profil gespeichert:", data);
    return;
  }

  // Überprüfe, ob der neue Username bereits existiert
  const { data: existingUser, error: checkError } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("username", new_username);

  if (checkError) {
    errorEl.textContent = "Fehler bei der Überprüfung des Usernames.";
    return console.error(checkError);
  }

  if (existingUser.length > 0) {
    errorEl.textContent = "Dieser Username ist bereits vergeben. Bitte wähle einen anderen.";
    return;
  }

  // Speichere das Profil
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id);

  if (error) return console.error(error);

  let res;
  if (data.length === 0) {
    res = await supabaseClient.from("profiles").insert({
      id: user.id,
      username: new_username,
      bio: new_bio
    });
  } else {
    res = await supabaseClient.from("profiles").update({
      username: new_username,
      bio: new_bio
    }).eq("id", user.id);
  }

  if (res.error) return console.error(res.error);
  console.log("Profil gespeichert:", res.data);
}

async function loadMyPosts() {
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return console.error(error);

  const el = document.getElementById("my-posts");
  el.innerHTML = "";

  data.forEach(p => {
    const div = document.createElement("div");
    div.textContent = p.content;
    el.appendChild(div);
  });
}