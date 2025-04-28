import random
import json
from BaseClasses import Tutorial, Region, MultiWorld, Item, CollectionState, ItemClassification
from Utils import visualize_regions
from worlds.AutoWorld import World
from Options import PerGameCommonOptions
from .Items import CCItem, traps, item_table, upgrades, structures, cookie_multiplier
from typing import Dict, Any
from .Locations import CCLocation, location_table
from .Options import CCOptions, cc_options

class CookieClicker(World):
    game = "Cookie Clicker"
    worldversion = "0.5.0"
    location_name_to_id = location_table
    option_definitions = cc_options
    item_name_to_id = item_table
    start_inventory = {}
    trashitems = 0
    options: CCOptions
    options_dataclass: CCOptions
    
    def _get_cc_data(self) -> Dict[str, Any]:
        return {
            'player_name': self.multiworld.get_player_name(self.player),
            'player_id': self.player,
            'advancement_goal': self.multiworld.advancement_goal[self.player].value,
            'traps_percentage': self.multiworld.traps_percentage[self.player].value,
            'race': self.multiworld.is_race
        }

    def create_regions(self):
        region = Region("Menu", self.player, self.multiworld)
        self.multiworld.regions.append(region)
        achievement_region = Region("Achievements Region", self.player, self.multiworld)
        self.multiworld.regions.append(achievement_region)
        for location in location_table:
            achievement_region.add_locations({ f"{location}":self.location_name_to_id[location]}, CCLocation)
        # Just one region for now, but we should add more later for sanity checks
        region.connect(achievement_region, "Achievements")

    def create_item(self, name: str) -> CCItem:
        if upgrades.get(name) is not None:
            return CCItem(name, ItemClassification.progression, self.item_name_to_id[name], self.player)
        if structures.get(name) is not None:
            return CCItem(name, ItemClassification.progression, self.item_name_to_id[name], self.player)
        if cookie_multiplier.get(name) is not None:
            return CCItem(name, ItemClassification.filler, self.item_name_to_id[name], self.player)
        return CCItem(name, ItemClassification.filler, self.item_name_to_id[name], self.player)

    def create_items(self):
        for upgrade in upgrades:
            self.multiworld.itempool.append(self.create_item(upgrade))
        for structure_unlock in structures:
            self.multiworld.itempool.append(self.create_item(structure_unlock))

        total_location_count = len(self.multiworld.get_unfilled_locations(self.player)) - len(cookie_multiplier) - len(upgrades) - len(structures)
        # Static value maybe variable in future 
        total_multiplier_location_count = int(len(self.multiworld.get_unfilled_locations(self.player)) * 0.35)

        for i in range(total_multiplier_location_count):
            self.multiworld.itempool.append(self.create_item(str(random.choice(list(cookie_multiplier.keys())))))

        trap_location_count = int((total_location_count - total_multiplier_location_count) * (self.multiworld.traps_percentage[self.player].value / 100))

        for i in range(trap_location_count):
            self.multiworld.itempool.append(self.create_item(str(random.choice(list(traps.keys())))))

    # We got some games which leave some locations unfilled, so we need to fill them with some filler items
    def pre_fill(self):
        missing_locs = len(self.multiworld.get_unfilled_locations()) - len(self.multiworld.itempool)
        if missing_locs > 0:
            self.multiworld.itempool += [self.create_filler() for _ in range(missing_locs)]

    def create_filler(self) -> Item:
        return self.create_item(str(random.choice(list(cookie_multiplier.keys()))))

    def fill_slot_data(self) -> dict:
        slot_data = self._get_cc_data()
        for option_name in cc_options:
            option = getattr(self.multiworld, option_name)[self.player]
            if slot_data.get(option_name, None) is None and type(option.value) in {str, int}:
                slot_data[option_name] = int(option.value)
        return slot_data