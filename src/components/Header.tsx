import {
  ActionIcon,
  Group,
  Menu,
  Avatar,
  Box,
} from "@mantine/core";
import {
  IconLogout,
  IconBrandStrava,
  IconTrash,
  IconDotsVertical,
  IconHome,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getStravaAccessToken,
  getStravaAuthUrl,
  disconnectStrava,
  getStravaAthlete,
} from "~/serverFunctions";
import { QueryCacheKeys } from "~/QueryCacheKeys";

export function Header() {
  const { user } = useRouteContext({ from: "__root__" });
  const queryClient = useQueryClient();
  const getToken = useServerFn(getStravaAccessToken);
  const getAuthUrl = useServerFn(getStravaAuthUrl);
  const disconnect = useServerFn(disconnectStrava);
  const getAthlete = useServerFn(getStravaAthlete);

  const { data: stravaToken, isLoading: isLoadingStravaToken } = useQuery({
    queryKey: QueryCacheKeys.stravaToken(),
    queryFn: () => getToken(),
    enabled: !!user,
  });

  const { data: stravaAthlete, isLoading: isLoadingStravaAthlete } = useQuery({
    queryKey: QueryCacheKeys.stravaAthlete(),
    queryFn: () => getAthlete(),
    enabled: !!user && stravaToken?.hasToken === true,
  });

  const handleStravaConnect = async () => {
    try {
      const { authUrl } = await getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error getting Strava auth URL:", error);
    }
  };

  const handleStravaDisconnect = async () => {
    try {
      await disconnect();
      queryClient.invalidateQueries({
        queryKey: QueryCacheKeys.stravaToken(),
      });
      queryClient.invalidateQueries({
        queryKey: QueryCacheKeys.stravaActivities(),
      });
      queryClient.invalidateQueries({
        queryKey: QueryCacheKeys.stravaAthlete(),
      });
    } catch (error) {
      console.error("Error disconnecting Strava:", error);
    }
  };

  const isStravaConnected = stravaToken?.hasToken === true;

  return (
    <>
      <Group w="100%" maw={"1200px"} mx="auto" p="xs">
        <Group justify="space-between" w="100%">
          {user && (
            <>
              <Menu shadow="md" width={200} withArrow>
                <Menu.Target>
                  {isStravaConnected && stravaAthlete?.profile ? (
                    <Box style={{ position: "relative", cursor: "pointer" }}>
                      <Avatar
                        src={stravaAthlete.profile}
                        alt="Strava profile"
                        size="md"
                        style={{
                          cursor: "pointer",
                          border: "2px solid var(--mantine-color-dark-9)",
                        }}
                        variant="outline"
                      />
                      <IconBrandStrava
                        size={20}
                        color="var(--mantine-color-orange-6)"
                        style={{
                          position: "absolute",
                          bottom: -4,
                          right: -4,
                          backgroundColor: "var(--mantine-color-orange-0)",
                          borderRadius: "50%",
                          padding: 2,
                        }}
                      />
                    </Box>
                  ) : (
                    <ActionIcon
                      variant="light"
                      size="lg"
                      color="orange"
                      loading={isLoadingStravaAthlete || isLoadingStravaToken}
                    >
                      <IconBrandStrava size={20} />
                    </ActionIcon>
                  )}
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>
                    {isStravaConnected && stravaAthlete
                      ? `${stravaAthlete.firstname} ${stravaAthlete.lastname}`
                      : "Strava"}
                  </Menu.Label>
                  {isStravaConnected ? (
                    <>
                      <Menu.Item
                        leftSection={<IconLogout size={20} />}
                        color="red"
                        onClick={handleStravaDisconnect}
                      >
                        Disconnect Strava
                      </Menu.Item>
                    </>
                  ) : (
                    <Menu.Item
                      leftSection={<IconBrandStrava size={16} />}
                      onClick={handleStravaConnect}
                    >
                      Connect Strava
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
              <Menu withArrow>
                <Menu.Target>
                  <ActionIcon
                    bg="transparent"
                    color="indigo.0"
                    radius="xl"
                    size="lg"
                  >
                    <IconDotsVertical size={24} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item component={Link} to="/" leftSection={<IconHome size={20} />}>
                    Home
                  </Menu.Item>
                  <Menu.Item
                    component={Link}
                    to="/logout"
                    leftSection={<IconLogout size={20} />}
                  >
                    Log out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </>
          )}
        </Group>
      </Group>
 
    </>
  );
}
