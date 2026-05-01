from rest_framework import serializers
from datetime import date
from .models import Motif, PlanningEntry, HistoriqueModification


class MotifSerializer(serializers.ModelSerializer):
    class Meta:
        model = Motif
        fields = ['id', 'code', 'libelle', 'couleur_hex', 'visible_collaborateur', 'ordre']


class PlanningEntrySerializer(serializers.ModelSerializer):
    motif_code = serializers.CharField(source='motif.code', read_only=True)
    motif_libelle = serializers.CharField(source='motif.libelle', read_only=True)
    motif_couleur = serializers.CharField(source='motif.couleur_hex', read_only=True)
    collaborateur_nom = serializers.CharField(
        source='collaborateur.nom_complet', read_only=True
    )
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)

    class Meta:
        model = PlanningEntry
        fields = [
            'id', 'collaborateur', 'collaborateur_nom',
            'jour', 'demi_journee',
            'motif', 'motif_code', 'motif_libelle', 'motif_couleur',
            'created_at', 'created_by', 'created_by_email',
            'updated_at', 'updated_by',
        ]
        read_only_fields = ['created_at', 'created_by', 'updated_at', 'updated_by']
        # Disable DRF auto-generated UniqueTogetherValidator — the upsert view
        # handles the unique constraint manually (create or update existing entry).
        validators = []

    def validate(self, data):
        """
        Validation des règles métier.
        is_upsert_update=True dans le contexte signifie qu'on est dans le path UPDATE
        de l'upsert — on ne re-valide pas la date (elle est déjà passée lors de la création).
        """
        request = self.context.get('request')
        user = request.user if request else None
        is_upsert_update = self.context.get('is_upsert_update', False)

        collaborateur = data.get('collaborateur', getattr(self.instance, 'collaborateur', None))
        jour = data.get('jour', getattr(self.instance, 'jour', None))
        motif = data.get('motif', getattr(self.instance, 'motif', None))

        if not user:
            raise serializers.ValidationError("Utilisateur non authentifié.")

        # Règle : un collaborateur ne peut modifier que sa propre ligne
        if not user.is_manager:
            try:
                own_collab = user.collaborateur
            except Exception:
                raise serializers.ValidationError("Votre compte n'est pas lié à un collaborateur.")
            if collaborateur != own_collab:
                raise serializers.ValidationError(
                    "Un collaborateur ne peut modifier que son propre planning."
                )
            # Règle : uniquement des jours futurs — pas applicable sur un UPDATE upsert
            # (l'entrée a été créée dans le passé, on met juste à jour le motif)
            if not is_upsert_update and jour and jour < date.today():
                raise serializers.ValidationError(
                    "Un collaborateur ne peut modifier que des jours futurs."
                )
            # Règle : seulement les motifs autorisés
            if motif and not motif.visible_collaborateur:
                raise serializers.ValidationError(
                    f"Le motif '{motif.libelle}' ne peut être saisi que par un manager ou admin."
                )

        return data


class PlanningBulkEntrySerializer(serializers.Serializer):
    """
    Permet de saisir plusieurs jours/demi-journées en une seule requête.
    Payload : { collaborateur_id, motif_id, jours: [{jour, demi_journee}] }
    """
    collaborateur_id = serializers.IntegerField()
    motif_id = serializers.IntegerField()
    jours = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )


class HistoriqueSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.CharField(
        source='collaborateur.nom_complet', read_only=True
    )
    ancien_motif_libelle = serializers.CharField(
        source='ancien_motif.libelle', read_only=True
    )
    nouveau_motif_libelle = serializers.CharField(
        source='nouveau_motif.libelle', read_only=True
    )
    auteur_email = serializers.EmailField(source='auteur.email', read_only=True)

    class Meta:
        model = HistoriqueModification
        fields = [
            'id', 'collaborateur', 'collaborateur_nom',
            'jour', 'demi_journee', 'action',
            'ancien_motif', 'ancien_motif_libelle',
            'nouveau_motif', 'nouveau_motif_libelle',
            'auteur', 'auteur_email', 'date_modif',
        ]
