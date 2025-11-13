// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// Based on the allowlist pattern

module walrus::allowlist;

use std::string::String;
use sui::dynamic_field as df;
use sui::event;
use walrus::utils::is_prefix;

const EInvalidCap: u64 = 0;
const ENoAccess: u64 = 1;
const EDuplicate: u64 = 2;
const MARKER: u64 = 3;

// ========== Events ==========

/// Event emitted when a new allowlist is created
public struct AllowlistCreated has copy, drop {
    allowlist_id: ID,
    name: String,
    creator: address,
}

/// Event emitted when an account is added to the allowlist
public struct AccountAdded has copy, drop {
    allowlist_id: ID,
    account: address,
    operator: address,
}

/// Event emitted when an account is removed from the allowlist
public struct AccountRemoved has copy, drop {
    allowlist_id: ID,
    account: address,
    operator: address,
}

/// Event emitted when a blob is published to the allowlist
public struct BlobPublished has copy, drop {
    allowlist_id: ID,
    blob_id: String,
    publisher: address,
}

public struct Allowlist has key {
    id: UID,
    name: String,
    list: vector<address>,
}

public struct Cap has key {
    id: UID,
    allowlist_id: ID,
}

//////////////////////////////////////////
/////// Simple allowlist with an admin cap

/// Create an allowlist with an admin cap.
/// The associated key-ids are [pkg id]::[allowlist id][nonce] for any nonce (thus
/// many key-ids can be created for the same allowlist).
public fun create_allowlist(name: String, ctx: &mut TxContext): Cap {
    let allowlist = Allowlist {
        id: object::new(ctx),
        list: vector::empty(),
        name: name,
    };
    let allowlist_id = object::id(&allowlist);
    let cap = Cap {
        id: object::new(ctx),
        allowlist_id: allowlist_id,
    };
    
    // Emit event
    event::emit(AllowlistCreated {
        allowlist_id: allowlist_id,
        name: name,
        creator: ctx.sender(),
    });
    
    transfer::share_object(allowlist);
    cap
}

// convenience function to create a allowlist and send it back to sender (simpler ptb for cli)
entry fun create_allowlist_entry(name: String, ctx: &mut TxContext) {
    transfer::transfer(create_allowlist(name, ctx), ctx.sender());
}

public fun add(allowlist: &mut Allowlist, cap: &Cap, account: address, ctx: &TxContext) {
    assert!(cap.allowlist_id == object::id(allowlist), EInvalidCap);
    assert!(!allowlist.list.contains(&account), EDuplicate);
    allowlist.list.push_back(account);
    
    // Emit event
    event::emit(AccountAdded {
        allowlist_id: object::id(allowlist),
        account: account,
        operator: ctx.sender(),
    });
}

public fun remove(allowlist: &mut Allowlist, cap: &Cap, account: address, ctx: &TxContext) {
    assert!(cap.allowlist_id == object::id(allowlist), EInvalidCap);
    allowlist.list = allowlist.list.filter!(|x| x != account); // TODO: more efficient impl?
    
    // Emit event
    event::emit(AccountRemoved {
        allowlist_id: object::id(allowlist),
        account: account,
        operator: ctx.sender(),
    });
}

//////////////////////////////////////////////////////////
/// Access control
/// key format: [pkg id]::[allowlist id][random nonce]
/// (Alternative key format: [pkg id]::[creator address][random nonce] - see private_data.move)

public fun namespace(allowlist: &Allowlist): vector<u8> {
    allowlist.id.to_bytes()
}

/// All allowlisted addresses can access all IDs with the prefix of the allowlist
fun approve_internal(caller: address, id: vector<u8>, allowlist: &Allowlist): bool {
    // Check if the id has the right prefix
    let namespace = namespace(allowlist);
    if (!is_prefix(namespace, id)) {
        return false
    };

    // Check if user is in the allowlist
    allowlist.list.contains(&caller)
}

entry fun seal_approve(id: vector<u8>, allowlist: &Allowlist, ctx: &TxContext) {
    assert!(approve_internal(ctx.sender(), id, allowlist), ENoAccess);
}

/// Encapsulate a blob into a Sui object and attach it to the allowlist
public fun publish(allowlist: &mut Allowlist, cap: &Cap, blob_id: String, ctx: &TxContext) {
    assert!(cap.allowlist_id == object::id(allowlist), EInvalidCap);
    df::add(&mut allowlist.id, blob_id, MARKER);
    
    // Emit event
    event::emit(BlobPublished {
        allowlist_id: object::id(allowlist),
        blob_id: blob_id,
        publisher: ctx.sender(),
    });
}

#[test_only]
public fun new_allowlist_for_testing(ctx: &mut TxContext): Allowlist {

    Allowlist {
        id: object::new(ctx),
        name: b"test".to_string(),
        list: vector::empty(),
    }
}

#[test_only]
public fun new_cap_for_testing(ctx: &mut TxContext, allowlist: &Allowlist): Cap {
    Cap {
        id: object::new(ctx),
        allowlist_id: object::id(allowlist),
    }
}

#[test_only]
public fun destroy_for_testing(allowlist: Allowlist, cap: Cap) {
    let Allowlist { id, .. } = allowlist;
    object::delete(id);
    let Cap { id, .. } = cap;
    object::delete(id);
}
