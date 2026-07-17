# Nestly Scaling

This document summarizes the current scaling posture and the next required platform moves.

## Current Scaling Reality

Nestly is not yet production-scale.

Much of the product still depends on local browser storage and local operational queues. This is acceptable for demo and early beta, but it will not support thousands of families across devices.

## Main Bottlenecks

- localStorage persistence
- no production database adapter
- no durable document storage
- no server-side job queue
- no server-side audit log
- no cloud analytics sink
- no real-time collaboration backend
- no database indexing strategy yet
- no tenant isolation enforced by database policies

## Required Architecture For Scale

To support thousands of families, Nestly needs:

- relational database or document database with tenant isolation
- Family Space scoped records
- row-level security or equivalent authorization
- cloud object storage for documents
- background worker queue
- scheduled jobs
- centralized logging
- metrics and tracing
- cache strategy for read-heavy dashboards
- migration pipeline

## High-Risk Data Domains

Prioritize hardening these first:

- documents
- finance
- health
- permissions
- family-space membership
- invitations

## Near-Term Recommendation

Move one complete journey to cloud persistence first, preferably Shopping or Tasks, before migrating all modules.
