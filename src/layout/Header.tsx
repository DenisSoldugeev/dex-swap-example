import type {FC} from "react";
import {Group, Text} from "@mantine/core";
import WalletButton from "../features/Wallet/WalletButton";
import {Link} from "../router";

export const Header: FC = () => (
    <Group h="100%" px="md" justify="space-between" align="center">
        <Group gap="xs">
            <Text fw={700} size="lg">
                POOL SCANNER
            </Text>
        </Group>
        <Group gap="lg" align="center">
            <WalletButton/>
        </Group>
    </Group>
);

export default Header;
