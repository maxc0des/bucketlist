async function getIdbyUsername(username) {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("username", username.trim());

    if (error) return console.error(error);
    return data && data.length > 0 ? data[0].id : null;
}

async function addFriend() {
  const friendUsername = document.getElementById("friend-username").value.trim();
  if (!friendUsername) return;

  const friendId = await getIdbyUsername(friendUsername);
  if (!friendId) {
    alert("Friend not found.");
    return;
  }

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError) return console.error(userError);

  // 🔍 CHECK: Existiert die Freundschaft schon?
  const { data: existing } = await supabaseClient
    .from("friends")
    .select("friend_id")
    .eq("user_id", user.id)
    .eq("friend_id", friendId);

  if (existing && existing.length > 0) {
    alert("Friend already added.");
    return;
  }

  // ➕ Insert
  const { error } = await supabaseClient
    .from("friends")
    .insert({ user_id: user.id, friend_id: friendId });

  if (error) return console.error(error);

  alert("Friend added!");
}


async function getFriendIds() {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError) {
    console.error(userError);
    return [];
  }

  const { data, error } = await supabaseClient
    .from("friends")
    .select("friend_id")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return [];
  }

  return data.map(row => row.friend_id);
}

async function getFriendProfiles() {
  const friendIds = await getFriendIds();

  if (friendIds.length === 0) return [];

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, username")
    .in("id", friendIds);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

async function renderFriends() {
  const friendsList = document.getElementById("friends-list");
  if (!friendsList) return;

  const profiles = await getFriendProfiles();
  friendsList.innerHTML = "";

  profiles.forEach(profile => {
    const li = document.createElement("li");
    li.textContent = profile.username;

    
    li.onclick = () => {window.location.href = `user.html?id=${profile.id}`;}
    friendsList.appendChild(li);
  });
}

async function removeFriend(friendId) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError) return console.error(userError);

  const { error } = await supabaseClient
    .from("friends")
    .delete()
    .eq("user_id", user.id)
    .eq("friend_id", friendId);

  if (error) {
    console.error(error);
    alert("Failed to remove friend");
    return;
  }

  alert("Friend removed!");
}