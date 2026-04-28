from rest_framework import serializers
from .models import Region, Domaine, Equipe, Collaborateur, AffectationCollaborateur


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'nom']


class DomaineSerializer(serializers.ModelSerializer):
    nom_display = serializers.CharField(source='get_nom_display', read_only=True)

    class Meta:
        model = Domaine
        fields = ['id', 'nom', 'nom_display']


class EquipeSerializer(serializers.ModelSerializer):
    region_nom = serializers.CharField(source='region.nom', read_only=True)
    domaine_nom = serializers.CharField(source='domaine.get_nom_display', read_only=True)
    nb_collaborateurs = serializers.SerializerMethodField()

    class Meta:
        model = Equipe
        fields = ['id', 'nom', 'region', 'region_nom', 'domaine', 'domaine_nom', 'active', 'nb_collaborateurs']

    def get_nb_collaborateurs(self, obj):
        return obj.collaborateurs.filter(actif=True).count()


class AffectationSerializer(serializers.ModelSerializer):
    equipe_nom = serializers.CharField(source='equipe.nom', read_only=True)
    region_nom = serializers.CharField(source='equipe.region.nom', read_only=True)

    class Meta:
        model = AffectationCollaborateur
        fields = ['id', 'equipe', 'equipe_nom', 'region_nom', 'date_debut', 'date_fin']
        read_only_fields = ['id']


class CollaborateurListSerializer(serializers.ModelSerializer):
    """Sérialiseur allégé pour les listes (planning, filtres)."""
    region_nom = serializers.SerializerMethodField()
    equipe_nom = serializers.CharField(source='equipe.nom', read_only=True)
    nom_complet = serializers.CharField(read_only=True)

    class Meta:
        model = Collaborateur
        fields = [
            'id', 'matricule', 'nom', 'prenom', 'nom_complet',
            'region_nom', 'equipe', 'equipe_nom',
            'date_entree', 'date_sortie', 'actif',
        ]

    def get_region_nom(self, obj):
        return obj.equipe.region.nom if obj.equipe else None


class CollaborateurDetailSerializer(serializers.ModelSerializer):
    region_nom = serializers.SerializerMethodField()
    equipe_nom = serializers.CharField(source='equipe.nom', read_only=True)
    nom_complet = serializers.CharField(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    affectations = AffectationSerializer(many=True, read_only=True)

    class Meta:
        model = Collaborateur
        fields = [
            'id', 'matricule', 'nom', 'prenom', 'nom_complet',
            'region_nom', 'equipe', 'equipe_nom',
            'date_entree', 'date_sortie', 'actif',
            'role', 'user', 'user_email',
            'affectations', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'role']

    def get_region_nom(self, obj):
        return obj.equipe.region.nom if obj.equipe else None

    def validate(self, data):
        date_entree = data.get('date_entree', getattr(self.instance, 'date_entree', None))
        date_sortie = data.get('date_sortie')
        if date_sortie and date_entree and date_sortie <= date_entree:
            raise serializers.ValidationError(
                {'date_sortie': "La date de sortie doit être postérieure à la date d'entrée."}
            )
        return data


class ChangerEquipeSerializer(serializers.Serializer):
    """Payload pour le changement d'équipe via le service dédié."""
    equipe_id = serializers.IntegerField()
    date_debut = serializers.DateField()
