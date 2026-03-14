import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Outlet {
    id: bigint;
    name: string;
    createdAt: bigint;
    location: string;
}
export interface UserProfile {
    name: string;
    role: string;
    email: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOutlet(name: string, location: string): Promise<bigint>;
    createUser(userPrincipal: Principal, name: string, email: string, role: string): Promise<void>;
    deleteOutlet(outletId: bigint): Promise<void>;
    deleteUser(userPrincipal: Principal): Promise<void>;
    getAllOutlets(): Promise<Array<Outlet>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOutlet(outletId: bigint): Promise<Outlet>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAllUsers(): Promise<Array<UserProfile>>;
    resetUserPassword(userPrincipal: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateOutlet(outletId: bigint, name: string, location: string): Promise<void>;
    updateUser(userPrincipal: Principal, name: string, email: string, role: string): Promise<void>;
}
