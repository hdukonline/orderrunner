import { TestDefinition } from "../types";
import { loginTest, portalLoginTest } from "./login.definition";
import { orderCreateTest } from "./order.definition";

/**
 * Central registry of available tests - 2-dimensional mapping of test name -> site -> TestDefinition
 * This allows us to easily look up and execute the correct test based on command line options
 * and also provides a single source of truth for what tests are available in the system.
 */
export const tests: Record<string, Record<string, TestDefinition>> = {
    login: {
        arena: loginTest,
        portal: portalLoginTest,
    },
    orderCreate: {
        arena: orderCreateTest,
    }
};