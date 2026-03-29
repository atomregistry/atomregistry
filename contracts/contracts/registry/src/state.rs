use atom_names_types::{NameRecord, SubdomainPolicy};
use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};

pub const ADMIN: Item<Addr> = Item::new("admin");
pub const PENDING_ADMIN: Item<Option<Addr>> = Item::new("pending_admin");
pub const REGISTRAR: Item<Option<Addr>> = Item::new("registrar");
pub const TLD_MANAGER: Item<Option<Addr>> = Item::new("tld_manager");
pub const MARKETPLACE: Item<Option<Addr>> = Item::new("marketplace");
pub const ROYALTY_RECIPIENT: Item<Addr> = Item::new("royalty_recipient");
pub const ROYALTY_BPS: Item<u16> = Item::new("royalty_bps");
pub const NAMES: Map<&str, NameRecord> = Map::new("names");
pub const OWNER_INDEX: Map<(&Addr, &str), bool> = Map::new("owner_index");
pub const PRIMARY: Map<&Addr, String> = Map::new("primary");
pub const SUBDOMAIN_POLICIES: Map<&str, SubdomainPolicy> = Map::new("subdomain_policies");
pub const SUBDOMAIN_MINTS: Map<(&str, &Addr), u32> = Map::new("subdomain_mints");
