from config import Settings
from workspace.local import LocalWorkspace

settings = Settings()

def get_workspace():

    if settings.WORKSPACE_TYPE == "local":
        return LocalWorkspace(root=settings.WORKSPACE_DIR)

    if settings.WORKSPACE_TYPE == "ssh":
        # TO DO: Add SSH Workspace
        return