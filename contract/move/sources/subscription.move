// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// Based on the subscription pattern.
// TODO: document and add tests

module walrus::subscription;

use std::string::String;
use sui::{clock::Clock, coin::Coin, dynamic_field as df, sui::SUI};
use sui::event;
use walrus::utils::is_prefix;

const EInvalidCap: u64 = 0;
const EInvalidFee: u64 = 1;
const ENoAccess: u64 = 2;
const MARKER: u64 = 3;

// ========== Events ==========

/// Event emitted when a new service is created
public struct ServiceCreated has copy, drop {
    service_id: ID,
    name: String,
    fee: u64,
    ttl: u64,
    owner: address,
}

/// Event emitted when a user subscribes to a service
public struct SubscriptionCreated has copy, drop {
    subscription_id: ID,
    service_id: ID,
    subscriber: address,
    fee_paid: u64,
    created_at: u64,
}

/// Event emitted when a blob is published to the service
public struct ServiceBlobPublished has copy, drop {
    service_id: ID,
    blob_id: String,
    publisher: address,
}

public struct Service has key {
    id: UID,
    fee: u64,
    ttl: u64,
    owner: address,
    name: String,
}

public struct Subscription has key {
    id: UID,
    service_id: ID,
    created_at: u64,
}

public struct Cap has key {
    id: UID,
    service_id: ID,
}

//////////////////////////////////////////
/////// Simple a service

/// Create a service.
/// The associated key-ids are [pkg id]::[service id][nonce] for any nonce (thus
/// many key-ids can be created for the same service).
public fun create_service(fee: u64, ttl: u64, name: String, ctx: &mut TxContext): Cap {
    let service = Service {
        id: object::new(ctx),
        fee: fee,
        ttl: ttl,
        owner: ctx.sender(),
        name: name,
    };
    let service_id = object::id(&service);
    let cap = Cap {
        id: object::new(ctx),
        service_id: service_id,
    };
    
    // Emit event
    event::emit(ServiceCreated {
        service_id: service_id,
        name: name,
        fee: fee,
        ttl: ttl,
        owner: ctx.sender(),
    });
    
    transfer::share_object(service);
    cap
}

// convenience function to create a service and share it (simpler ptb for cli)
entry fun create_service_entry(fee: u64, ttl: u64, name: String, ctx: &mut TxContext) {
    transfer::transfer(create_service(fee, ttl, name, ctx), ctx.sender());
}

public fun subscribe(
    fee: Coin<SUI>,
    service: &Service,
    c: &Clock,
    ctx: &mut TxContext,
): Subscription {
    assert!(fee.value() == service.fee, EInvalidFee);
    let fee_amount = fee.value();
    transfer::public_transfer(fee, service.owner);
    
    let subscription = Subscription {
        id: object::new(ctx),
        service_id: object::id(service),
        created_at: c.timestamp_ms(),
    };
    
    // Emit event
    event::emit(SubscriptionCreated {
        subscription_id: object::id(&subscription),
        service_id: object::id(service),
        subscriber: ctx.sender(),
        fee_paid: fee_amount,
        created_at: c.timestamp_ms(),
    });
    
    subscription
}

public fun transfer(sub: Subscription, to: address) {
    transfer::transfer(sub, to);
}

#[test_only]
public fun destroy_for_testing(ser: Service, sub: Subscription) {
    let Service { id, .. } = ser;
    object::delete(id);
    let Subscription { id, .. } = sub;
    object::delete(id);
}

//////////////////////////////////////////////////////////
/// Access control
/// key format: [pkg id]::[service id][random nonce]

/// All allowlisted addresses can access all IDs with the prefix of the allowlist
fun approve_internal(id: vector<u8>, sub: &Subscription, service: &Service): bool {
    if (object::id(service) != sub.service_id) {
        return false
    };
    
    // 永久订阅：取消时间限制检查
    // 只要持有 Subscription NFT 就可以一直访问
    // 不再检查 TTL 和时间戳

    // Check if the id has the right prefix
    is_prefix(service.id.to_bytes(), id)
}

entry fun seal_approve(id: vector<u8>, sub: &Subscription, service: &Service) {
    assert!(approve_internal(id, sub, service), ENoAccess);
}

/// Encapsulate a blob into a Sui object and attach it to the Subscription
public fun publish(service: &mut Service, cap: &Cap, blob_id: String, ctx: &TxContext) {
    assert!(cap.service_id == object::id(service), EInvalidCap);
    df::add(&mut service.id, blob_id, MARKER);
    
    // Emit event
    event::emit(ServiceBlobPublished {
        service_id: object::id(service),
        blob_id: blob_id,
        publisher: ctx.sender(),
    });
}
