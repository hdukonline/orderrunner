import { test } from "@playwright/test";
import { orderCreateTest } from "../playwright/tests/order.definition";

test("Arena Order Create test", async ({ page }) => {
    test.slow();

    const testProduct = {
        category: "rollers",
        name: "Roller Blinds",
        value: "ROB"
    };

    await orderCreateTest.run(page, {
        test: "orderCreate",
        browser: "chromium",
        runs: 1,
        headless: true,
        url: "https://arena-test.hblonline.co.uk/",
        username: "smoketest",
        password: "SmokeTest",
        reference: undefined,
        productCategory: testProduct.category,
        saveOrder: false,
        submitOrder: true,
        returnIdoc: false,
        screenshots: {
            configure: false,
            basket: false,
            confirmation: false,
            unsubmittedOrders: false,
        },
        configureValues: {
            "Product Lining Type": { by: 'value', value: testProduct.value },
            "Product Type": { by: 'value', value: testProduct.value },

            "System Type": { by: "value", value: "S" },
            "Control Type": { by: "value", value: "MOT" },
            "Barrel Type": { by: "value", value: "MR" },
            "Motorisation Solution": { by: "value", value: "SOMF" },
            "Range": { by: "value", value: "ROBKONA" },
            "Colourway": { by: "value", value: "WHIT" },
            "Exact or Recess": { by: "value", value: "E" },
            "Units of Measurement": { by: "value", value: "I" },

            "Width": { by: "value", value: "67.05" },
            "Drop": { by: "value", value: "45.82" },

            "Brackets Colour": { by: "value", value: "WH" },

            // IMPORTANT: this field was auto-corrected during recovery
            // Initially set to "Y", then re-selected to "N"
            //"Bracket Covers": { by: "value", value: "Y" },

            "Barrel Diameter": { by: "value", value: "48" },
            "Bracket Size": { by: "value", value: "LRG" },
            "Reverse Roll": { by: "value", value: "Y" },
            "Shape": { by: "value", value: "20" },
            "Bottom Bar Type": { by: "value", value: "STND" },
            "Trim": { by: "value", value: "LBM5" },
            "Pole Pull Type": { by: "value", value: "LMP2" },
            "Finial": { by: "value", value: "LMF8" },

            "Location (this will appear on label)": {
                by: "value",
                value: "mNlHWSWXj6"
            },

            "Qty": { by: "value", value: "1" }

        },
    });
});