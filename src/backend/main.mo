import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    email : Text;
    role : Text; // "admin" or "user"
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // User Management (Admin Only)
  public shared ({ caller }) func createUser(userPrincipal : Principal, name : Text, email : Text, role : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create users");
    };

    let userRole : AccessControl.UserRole = if (role == "admin") {
      #admin;
    } else {
      #user;
    };

    AccessControl.assignRole(accessControlState, caller, userPrincipal, userRole);

    let profile : UserProfile = {
      name;
      email;
      role;
    };
    userProfiles.add(userPrincipal, profile);
  };

  public shared ({ caller }) func deleteUser(userPrincipal : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    userProfiles.remove(userPrincipal);
  };

  public query ({ caller }) func listAllUsers() : async [UserProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    userProfiles.values().toArray();
  };

  public shared ({ caller }) func updateUser(userPrincipal : Principal, name : Text, email : Text, role : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update users");
    };

    let userRole : AccessControl.UserRole = if (role == "admin") {
      #admin;
    } else {
      #user;
    };

    AccessControl.assignRole(accessControlState, caller, userPrincipal, userRole);

    let profile : UserProfile = {
      name;
      email;
      role;
    };
    userProfiles.add(userPrincipal, profile);
  };

  public shared ({ caller }) func resetUserPassword(userPrincipal : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can reset passwords");
    };
    // Password reset logic would be handled by the authentication system
    // This is a placeholder for the authorization check
  };

  // Outlet Management
  public type Outlet = {
    id : Nat;
    name : Text;
    location : Text;
    createdAt : Int;
  };

  var nextOutletId = 1;
  let outlets = Map.empty<Nat, Outlet>();

  public shared ({ caller }) func createOutlet(name : Text, location : Text) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create outlets");
    };

    let outlet : Outlet = {
      id = nextOutletId;
      name;
      location;
      createdAt = Time.now();
    };

    outlets.add(nextOutletId, outlet);
    nextOutletId += 1;
    outlet.id;
  };

  public shared ({ caller }) func deleteOutlet(outletId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete outlets");
    };
    if (not outlets.containsKey(outletId)) {
      Runtime.trap("Outlet not found");
    };
    outlets.remove(outletId);
  };

  public query ({ caller }) func getOutlet(outletId : Nat) : async Outlet {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view outlets");
    };
    switch (outlets.get(outletId)) {
      case (null) { Runtime.trap("Outlet not found") };
      case (?outlet) { outlet };
    };
  };

  public query ({ caller }) func getAllOutlets() : async [Outlet] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all outlets");
    };
    outlets.values().toArray();
  };

  public shared ({ caller }) func updateOutlet(outletId : Nat, name : Text, location : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update outlets");
    };

    switch (outlets.get(outletId)) {
      case (null) { Runtime.trap("Outlet not found") };
      case (?existingOutlet) {
        let updatedOutlet : Outlet = {
          existingOutlet with
          name;
          location;
        };
        outlets.add(outletId, updatedOutlet);
      };
    };
  };
};
