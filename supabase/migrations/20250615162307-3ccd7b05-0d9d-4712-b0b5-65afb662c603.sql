
CREATE OR REPLACE FUNCTION public.demote_other_admins(p_user_id_to_keep uuid)
RETURNS void AS $$
BEGIN
    -- This function can only be executed by an Administrator.
    IF public.get_user_role(auth.uid()) <> 'Administrator' THEN
        RAISE EXCEPTION 'Only Administrators can perform this action.';
    END IF;

    -- Demote all other administrators to 'Bekijker'
    UPDATE public.profiles
    SET role = 'Bekijker'
    WHERE role = 'Administrator' AND id <> p_user_id_to_keep;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
